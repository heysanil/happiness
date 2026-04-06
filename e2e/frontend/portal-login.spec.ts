import { expect, test } from '@playwright/test';
import { TEST_DONOR_EMAIL } from '../helpers/fixtures';
import { clearMailbox, extractOTP, getLatestEmail } from '../helpers/mailpit';

test.describe('Portal login page', () => {
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

        const otp = await extractOTP(TEST_DONOR_EMAIL);

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

        // Wait for first email to arrive
        await getLatestEmail(TEST_DONOR_EMAIL);

        // Click "Resend code"
        await page.getByRole('button', { name: 'Resend code' }).click();

        // Wait a bit then check MailPit has at least 2 messages
        // Poll until a second email arrives
        const maxWait = 15_000;
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
                if (messageCount >= 2) break;
            }
            await new Promise((r) => setTimeout(r, interval));
        }

        expect(messageCount).toBeGreaterThanOrEqual(2);
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
