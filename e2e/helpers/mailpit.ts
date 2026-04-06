// ---------------------------------------------------------------------------
// MailPit REST API helpers for E2E tests
// ---------------------------------------------------------------------------

import { MAILPIT_URL } from './fixtures';

const API_BASE = `${MAILPIT_URL}/api/v1`;

/**
 * Flushes the Redis database used by better-auth.
 * This resets rate limits, sessions, and OTP state between tests.
 */
export async function flushRedis(): Promise<void> {
    const { default: Redis } = await import('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6380';
    const redis = new Redis(redisUrl);
    await redis.flushdb();
    await redis.quit();
}

interface MailpitMessage {
    ID: string;
    Subject: string;
    Snippet: string;
    [key: string]: unknown;
}

interface MailpitSearchResult {
    messages: MailpitMessage[];
}

interface ParsedEmail {
    id: string;
    subject: string;
    text: string;
    html: string;
}

/**
 * Polls MailPit for the latest email sent to `to`.
 * Retries for up to 20 seconds at 1-second intervals.
 * Callers that need resilience to SMTP timeouts should retry with
 * a "Resend code" click between attempts.
 */
export async function getLatestEmail(to: string): Promise<ParsedEmail> {
    const maxWait = 20_000;
    const interval = 1_000;
    const deadline = Date.now() + maxWait;

    while (Date.now() < deadline) {
        const searchRes = await fetch(
            `${API_BASE}/search?query=to:${encodeURIComponent(to)}`,
        );
        if (searchRes.ok) {
            const result: MailpitSearchResult = await searchRes.json();
            if (result.messages && result.messages.length > 0) {
                const latest = result.messages[0];
                // Fetch the full message
                const msgRes = await fetch(`${API_BASE}/message/${latest.ID}`);
                if (msgRes.ok) {
                    const msg = await msgRes.json();
                    return {
                        id: latest.ID,
                        subject: msg.Subject ?? latest.Subject,
                        text: msg.Text ?? '',
                        html: msg.HTML ?? '',
                    };
                }
            }
        }
        await new Promise((r) => setTimeout(r, interval));
    }

    throw new Error(`No email found for "${to}" after ${maxWait / 1000}s`);
}

/**
 * Retrieves the latest email for `to` and extracts a 6-digit OTP code.
 */
export async function extractOTP(to: string): Promise<string> {
    const email = await getLatestEmail(to);
    const match = email.text.match(/\b(\d{6})\b/);
    if (!match) {
        throw new Error(
            `No 6-digit OTP found in email body for "${to}". Body: ${email.text.slice(0, 200)}`,
        );
    }
    return match[1];
}

/**
 * Deletes all messages in the MailPit mailbox.
 */
export async function clearMailbox(): Promise<void> {
    await fetch(`${API_BASE}/messages`, { method: 'DELETE' });
}
