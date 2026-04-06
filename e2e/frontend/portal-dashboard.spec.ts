import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAsDonor } from '../helpers/auth';
import { TEST_DONOR_EMAIL, TEST_DONOR_FIRST } from '../helpers/fixtures';

const AUTH_STATE = path.join(__dirname, '..', '.dashboard-auth-state.json');

test.describe('Portal dashboard', () => {
    test.describe('authenticated', () => {
        // loginAsDonor can retry OTP extraction multiple times if SMTP is slow
        test.setTimeout(120_000);

        test.beforeEach(async ({ page, context }) => {
            // Try to reuse a previously saved auth session to avoid
            // repeated OTP emails that exhaust the SMTP connection.
            if (fs.existsSync(AUTH_STATE)) {
                const cookies = JSON.parse(
                    fs.readFileSync(AUTH_STATE, 'utf-8'),
                );
                await context.addCookies(cookies);
                await page.goto('/portal/dashboard');
                // Verify the session is still valid (not redirected to /portal)
                const url = page.url();
                if (url.includes('/portal/dashboard')) {
                    return;
                }
                // Session expired — fall through to full login
            }

            await loginAsDonor(page, TEST_DONOR_EMAIL);

            // Save the auth cookies for subsequent tests
            const cookies = await context.cookies();
            fs.writeFileSync(AUTH_STATE, JSON.stringify(cookies));
        });

        test('shows welcome message with donor first name', async ({
            page,
        }) => {
            await expect(
                page.getByRole('heading', {
                    name: new RegExp(`Welcome back,?\\s*${TEST_DONOR_FIRST}`),
                }),
            ).toBeVisible();
        });

        test('donation history section is visible', async ({ page }) => {
            await expect(
                page.getByRole('heading', { name: 'Donation History' }),
            ).toBeVisible();
        });

        test('donation table shows seeded donation with correct amount', async ({
            page,
        }) => {
            // The seeded donation is $50.00
            const table = page.locator('table');
            await expect(table).toBeVisible();

            // Check column headers
            await expect(page.getByText('Campaign')).toBeVisible();
            await expect(page.getByText('Amount')).toBeVisible();
            await expect(page.getByText('Date')).toBeVisible();
            await expect(page.getByText('Receipt')).toBeVisible();

            // The seeded donation amount is 5000 cents = $50.00
            await expect(table.getByText('$50.00')).toBeVisible();
        });

        test('sign out button redirects to /portal', async ({ page }) => {
            const signOutButton = page.getByRole('button', {
                name: /sign out/i,
            });
            await expect(signOutButton).toBeVisible();

            await signOutButton.click();

            await page.waitForURL('**/portal', { timeout: 15_000 });
            // Ensure we are on /portal and NOT /portal/dashboard
            expect(page.url()).toMatch(/\/portal\/?$/);
        });
    });

    test.describe('unauthenticated', () => {
        test('accessing /portal/dashboard redirects to /portal', async ({
            browser,
        }) => {
            // Use a fresh context without any login state
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto('/portal/dashboard');

            // The server-side check redirects unauthenticated users to /portal
            await page.waitForURL('**/portal', { timeout: 15_000 });
            expect(page.url()).toMatch(/\/portal\/?$/);

            await context.close();
        });
    });
});
