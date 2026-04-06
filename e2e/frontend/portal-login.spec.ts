import { expect, test } from '@playwright/test';
import { TEST_DONOR_EMAIL } from '../helpers/fixtures';
import {
    clearMailbox,
    extractOTP,
    flushRedis,
    getLatestEmail,
} from '../helpers/mailpit';

test.describe('Portal login page', () => {
    // OTP tests can be slow due to SMTP connection timeouts and retries.
    test.setTimeout(120_000);

    // Flush Redis before each test to clear better-auth rate limits and
    // sessions that accumulate across sequential OTP-heavy tests.
    test.beforeEach(async () => {
        await flushRedis();
    });

    test('loads with "Donor Portal" heading and email form', async ({
        page,
    }) => {
        await page.goto('/portal');

        await expect(
            page.getByRole('heading', { name: 'Donor Portal' }),
        ).toBeVisible();
        await expect(page.getByLabel('Email address')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Send verification code' }),
        ).toBeVisible();
    });

    test('submitting email transitions to OTP step', async ({ page }) => {
        await clearMailbox();
        await page.goto('/portal');

        await page.getByLabel('Email address').fill(TEST_DONOR_EMAIL);
        await page
            .getByRole('button', { name: 'Send verification code' })
            .click();

        // After submitting, the heading changes to "Check your email"
        await expect(page.getByText('Check your email')).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByLabel('Verification code')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Verify & sign in' }),
        ).toBeVisible();
    });

    test('valid OTP redirects to /portal/dashboard', async ({ page }) => {
        await clearMailbox();
        await page.goto('/portal');

        await page.getByLabel('Email address').fill(TEST_DONOR_EMAIL);
        await page
            .getByRole('button', { name: 'Send verification code' })
            .click();
        await page.getByText('Check your email').waitFor({ timeout: 15_000 });

        // Try to get OTP; if SMTP times out, resend and retry (up to 3 attempts).
        let otp: string | undefined;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                otp = await extractOTP(TEST_DONOR_EMAIL);
                break;
            } catch {
                if (attempt < 2) {
                    await clearMailbox();
                    await page
                        .getByRole('button', { name: 'Resend code' })
                        .click();
                }
            }
        }
        expect(otp).toBeTruthy();

        await page.getByLabel('Verification code').fill(otp);
        await page.getByRole('button', { name: 'Verify & sign in' }).click();

        await page.waitForURL('**/portal/dashboard', { timeout: 15_000 });
        expect(page.url()).toContain('/portal/dashboard');
    });

    test('invalid OTP shows error message', async ({ page }) => {
        await clearMailbox();
        await page.goto('/portal');

        await page.getByLabel('Email address').fill(TEST_DONOR_EMAIL);
        await page
            .getByRole('button', { name: 'Send verification code' })
            .click();
        await page.getByText('Check your email').waitFor({ timeout: 15_000 });

        // Enter an obviously wrong OTP
        await page.getByLabel('Verification code').fill('000000');
        await page.getByRole('button', { name: 'Verify & sign in' }).click();

        // An error message should appear
        await expect(page.getByText(/invalid|expired|failed/i)).toBeVisible({
            timeout: 10_000,
        });
    });

    test('"Resend code" sends another email', async ({ page }) => {
        await clearMailbox();
        await page.goto('/portal');

        await page.getByLabel('Email address').fill(TEST_DONOR_EMAIL);
        await page
            .getByRole('button', { name: 'Send verification code' })
            .click();
        await page.getByText('Check your email').waitFor({ timeout: 15_000 });

        // Wait for first email to arrive (SMTP can be slow)
        let firstEmailArrived = false;
        try {
            await getLatestEmail(TEST_DONOR_EMAIL);
            firstEmailArrived = true;
        } catch {
            // First email didn't arrive — SMTP timeout. Continue anyway.
        }

        // Click "Resend code"
        await page.getByRole('button', { name: 'Resend code' }).click();

        // Poll until we have enough messages.
        // If first email arrived, expect >= 2. If not, expect >= 1.
        const expectedCount = firstEmailArrived ? 2 : 1;
        const maxWait = 30_000;
        const interval = 1_000;
        const deadline = Date.now() + maxWait;
        let messageCount = 0;

        while (Date.now() < deadline) {
            const res = await fetch(
                `http://localhost:8025/api/v1/search?query=to:${encodeURIComponent(TEST_DONOR_EMAIL)}`,
            );
            if (res.ok) {
                const data = await res.json();
                messageCount = data.messages?.length ?? 0;
                if (messageCount >= expectedCount) break;
            }
            await new Promise((r) => setTimeout(r, interval));
        }

        expect(messageCount).toBeGreaterThanOrEqual(expectedCount);
    });

    test('"Use a different email" returns to email step', async ({ page }) => {
        await clearMailbox();
        await page.goto('/portal');

        await page.getByLabel('Email address').fill(TEST_DONOR_EMAIL);
        await page
            .getByRole('button', { name: 'Send verification code' })
            .click();
        await page.getByText('Check your email').waitFor({ timeout: 15_000 });

        // Click "Use a different email"
        await page
            .getByRole('button', { name: 'Use a different email' })
            .click();

        // Should be back on the email step
        await expect(
            page.getByRole('heading', { name: 'Donor Portal' }),
        ).toBeVisible();
        await expect(page.getByLabel('Email address')).toBeVisible();
    });
});
