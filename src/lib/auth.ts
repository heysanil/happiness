import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import nodemailer from 'nodemailer';

interface RedisLike {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, opts?: { ex?: number }): Promise<unknown>;
    del(key: string): Promise<unknown>;
}

const getRedis = (() => {
    let instance: RedisLike | null = null;
    return (): RedisLike => {
        if (!instance) {
            if (process.env.AUTH_REDIS_DRIVER === 'ioredis') {
                // biome-ignore lint: conditional dynamic import for test Redis
                const IORedis =
                    require('ioredis').default || require('ioredis');
                const redisUrl =
                    process.env.REDIS_URL || 'redis://127.0.0.1:6379';
                const client = new IORedis(redisUrl);
                instance = {
                    async get(key: string) {
                        const val = await client.get(key);
                        return val ?? null;
                    },
                    async set(
                        key: string,
                        value: string,
                        opts?: { ex?: number },
                    ) {
                        if (opts?.ex) {
                            await client.set(key, value, 'EX', opts.ex);
                        } else {
                            await client.set(key, value);
                        }
                    },
                    async del(key: string) {
                        await client.del(key);
                    },
                };
            } else {
                // biome-ignore lint: conditional dynamic import for Upstash
                const { Redis } = require('@upstash/redis');
                if (
                    !process.env.UPSTASH_REDIS_REST_URL ||
                    !process.env.UPSTASH_REDIS_REST_TOKEN
                ) {
                    throw new Error(
                        'Please set the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables',
                    );
                }
                const upstash = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                });
                instance = {
                    async get(key: string) {
                        const raw = await upstash.get(key);
                        if (raw === null || raw === undefined) return null;
                        return typeof raw === 'string'
                            ? raw
                            : JSON.stringify(raw);
                    },
                    async set(
                        key: string,
                        value: string,
                        opts?: { ex?: number },
                    ) {
                        if (opts?.ex) {
                            await upstash.set(key, value, { ex: opts.ex });
                        } else {
                            await upstash.set(key, value);
                        }
                    },
                    async del(key: string) {
                        await upstash.del(key);
                    },
                };
            }
        }
        return instance;
    };
})();

const getSmtpTransporter = (() => {
    let transporter: nodemailer.Transporter | null = null;
    return () => {
        if (!transporter) {
            if (
                !process.env.SMTP_HOST ||
                !process.env.SMTP_USER ||
                !process.env.SMTP_PASS
            ) {
                throw new Error(
                    'SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables are required for sending OTP emails',
                );
            }
            console.log(
                `[auth] Creating SMTP transporter — host=${process.env.SMTP_HOST}, port=${process.env.SMTP_PORT ?? 587}`,
            );
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT ?? 587),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                connectionTimeout: 10000,
                socketTimeout: 10000,
            });
        }
        return transporter;
    };
})();

export const auth = betterAuth({
    basePath: '/auth',
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    secondaryStorage: {
        get: async (key) => {
            const value = await getRedis().get(key);
            console.log(
                `[auth:redis] GET ${key} → ${value ? value.slice(0, 80) : 'null'}`,
            );
            return value;
        },
        set: async (key, value, ttl) => {
            console.log(`[auth:redis] SET ${key} (ttl=${ttl ?? 'none'})`);
            if (ttl) {
                await getRedis().set(key, value, { ex: ttl });
            } else {
                await getRedis().set(key, value);
            }
        },
        delete: async (key) => {
            console.log(`[auth:redis] DEL ${key}`);
            await getRedis().del(key);
        },
    },
    emailAndPassword: { enabled: false },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 7 * 24 * 60 * 60,
            strategy: 'jwe',
        },
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                console.log(
                    `[auth] sendVerificationOTP called — type=${type}, email=${email}`,
                );

                const subjectMap: Record<typeof type, string> = {
                    'sign-in': 'Your sign-in code',
                    'email-verification': 'Verify your email',
                    'forget-password': 'Reset your password',
                    'change-email': 'Confirm your new email',
                };

                try {
                    const info = await getSmtpTransporter().sendMail({
                        from: process.env.SMTP_FROM,
                        to: email,
                        subject: subjectMap[type] ?? 'Your verification code',
                        text: `Your verification code is: ${otp}`,
                        html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
                    });
                    console.log(
                        `[auth] OTP email sent — messageId=${info.messageId}`,
                    );
                } catch (err) {
                    console.error('[auth] Failed to send OTP email:', err);
                    throw err;
                }
            },
        }),
    ],
});
