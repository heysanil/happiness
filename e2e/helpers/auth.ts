// ---------------------------------------------------------------------------
// Donor portal login automation for E2E tests
// ---------------------------------------------------------------------------

import type { Page } from '@playwright/test';
import { clearMailbox, extractOTP } from './mailpit';

/**
 * Automates the email-OTP login flow for the donor portal.
 *
 * 1. Clears the MailPit mailbox so we only pick up the fresh OTP.
 * 2. Navigates to /portal and fills in the email address.
 * 3. Clicks the send-code button and waits for the confirmation text.
 * 4. Extracts the 6-digit OTP from the email via MailPit.
 * 5. Fills the OTP and submits, then waits for redirect to the dashboard.
 */
export async function loginAsDonor(page: Page, email: string) {
    await clearMailbox();
    await page.goto('/portal');

    // The email input is inside a Paris UI <Input> with label "Email address"
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Send verification code' }).click();

    // Wait for the app to show the OTP entry screen
    await page.getByText('Check your email').waitFor({ timeout: 15_000 });

    const otp = await extractOTP(email);

    await page.getByLabel('Verification code').fill(otp);
    await page.getByRole('button', { name: 'Verify & sign in' }).click();

    // Wait for successful redirect to the donor dashboard
    await page.waitForURL('**/portal/dashboard', { timeout: 15_000 });
}
