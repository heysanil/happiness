'use client';

import { authClient } from '@lib/auth-client';
import { HappinessConfig } from 'happiness.config';
import { useRouter } from 'next/navigation';
import { Button } from 'paris/button';
import { Input } from 'paris/input';
import { Text } from 'paris/text';
import { useEffect, useState } from 'react';

export default function PortalLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        authClient.getSession().then((session) => {
            if (session?.data?.user) {
                router.replace('/portal/dashboard');
            }
        });
    }, [router]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const result = await authClient.emailOtp.sendVerificationOtp({
                email: email.trim(),
                type: 'sign-in',
            });

            if (result.error) {
                setError(
                    result.error.message ??
                        'Failed to send verification code. Please try again.',
                );
                return;
            }

            setStep('otp');
        } catch {
            setError('Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const result = await authClient.signIn.emailOtp({
                email: email.trim(),
                otp: otp.trim(),
            });

            if (result.error) {
                setError(
                    result.error.message ??
                        'Invalid or expired code. Please try again.',
                );
                return;
            }

            router.push('/portal/dashboard');
        } catch {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError(null);
        setOtp('');

        try {
            const result = await authClient.emailOtp.sendVerificationOtp({
                email: email.trim(),
                type: 'sign-in',
            });

            if (result.error) {
                setError(
                    result.error.message ??
                        'Failed to resend code. Please try again.',
                );
            }
        } catch {
            setError('Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{
                background: 'var(--pte-colors-backgroundPrimary, #ffffff)',
            }}
        >
            <div className="w-full max-w-md flex flex-col items-center gap-8">
                {/* Logo */}
                <a href="/" className="flex items-center">
                    <img
                        src={HappinessConfig.logoWide || HappinessConfig.logo}
                        alt={HappinessConfig.name}
                        className="h-8"
                    />
                </a>

                {/* Card */}
                <div
                    className="w-full flex flex-col gap-6 p-8 rounded-lg"
                    style={{
                        border: '1px solid var(--pte-colors-borderOpaque, #e5e5e5)',
                        background:
                            'var(--pte-colors-backgroundPrimary, #ffffff)',
                    }}
                >
                    {step === 'email' ? (
                        <form
                            onSubmit={handleSendOtp}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex flex-col gap-2">
                                <Text kind="headingSmall" as="h1">
                                    Donor Portal
                                </Text>
                                <Text
                                    kind="paragraphMedium"
                                    as="p"
                                    style={{
                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                    }}
                                >
                                    Enter your email to view your donation
                                    history.
                                </Text>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Input
                                    label="Email address"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    autoComplete="email"
                                    required
                                />

                                {error && (
                                    <Text
                                        kind="paragraphSmall"
                                        as="p"
                                        style={{
                                            color: 'var(--pte-colors-contentNegative, #dc2626)',
                                        }}
                                    >
                                        {error}
                                    </Text>
                                )}

                                <Button
                                    kind="primary"
                                    type="submit"
                                    disabled={loading || !email.trim()}
                                    style={{ width: '100%' }}
                                >
                                    {loading
                                        ? 'Sending...'
                                        : 'Send verification code'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={handleVerifyOtp}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex flex-col gap-2">
                                <Text kind="headingSmall" as="h1">
                                    Check your email
                                </Text>
                                <Text
                                    kind="paragraphMedium"
                                    as="p"
                                    style={{
                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                    }}
                                >
                                    We sent a 6-digit code to{' '}
                                    <strong
                                        style={{
                                            color: 'var(--pte-colors-contentPrimary, #131313)',
                                        }}
                                    >
                                        {email}
                                    </strong>
                                    .
                                </Text>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Input
                                    label="Verification code"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 6);
                                        setOtp(val);
                                        if (error) setError(null);
                                    }}
                                    autoComplete="one-time-code"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    required
                                />

                                {error && (
                                    <Text
                                        kind="paragraphSmall"
                                        as="p"
                                        style={{
                                            color: 'var(--pte-colors-contentNegative, #dc2626)',
                                        }}
                                    >
                                        {error}
                                    </Text>
                                )}

                                <Button
                                    kind="primary"
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    style={{ width: '100%' }}
                                >
                                    {loading
                                        ? 'Verifying...'
                                        : 'Verify & sign in'}
                                </Button>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={loading}
                                    className="text-sm underline underline-offset-4 cursor-pointer disabled:opacity-50"
                                    style={{
                                        color: 'var(--pte-colors-contentAccent, #2563eb)',
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                    }}
                                >
                                    Resend code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('email');
                                        setOtp('');
                                        setError(null);
                                    }}
                                    className="text-sm underline underline-offset-4 cursor-pointer"
                                    style={{
                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                    }}
                                >
                                    Use a different email
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
