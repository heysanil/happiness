import { expect, test } from '@playwright/test';
import { loginAsDonor } from '../helpers/auth';
import {
    BASE_URL,
    TEST_DONATION_ID,
    TEST_DONOR_EMAIL,
    TEST_DONOR_FIRST,
} from '../helpers/fixtures';

test.describe('Donor Portal Flow', () => {
    test.setTimeout(120_000);

    test('full donor portal journey', async ({ page, request }) => {
        // Step 1: Log in via email OTP
        await loginAsDonor(page, TEST_DONOR_EMAIL);

        // Step 2: Verify the dashboard shows a welcome greeting with the donor's first name
        await expect(
            page.getByText(`Welcome back, ${TEST_DONOR_FIRST}`),
        ).toBeVisible();

        // Step 3: Verify the donation history section is visible
        await expect(page.getByText('Donation History')).toBeVisible();

        // Step 4: Verify the donations table is present and the seeded donation appears
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // The seeded donation is $50.00 for "E2E Simple Page"
        await expect(table.getByText('E2E Simple Page')).toBeVisible();
        await expect(table.getByText('$50.00')).toBeVisible();

        // Step 5: Test receipt download via a direct API request
        // The receipt route returns a PDF for the given donation ID
        const receiptRes = await request.get(
            `${BASE_URL}/receipts/${TEST_DONATION_ID}`,
        );
        expect(receiptRes.status()).toBe(200);
        const contentType = receiptRes.headers()['content-type'] || '';
        expect(contentType).toContain('pdf');

        // Step 6: Sign out
        await page.getByTitle('Sign out').click();

        // Step 7: Verify redirected back to the portal login page
        await page.waitForURL('**/portal', { timeout: 15_000 });
        await expect(page.getByText('Donor Portal')).toBeVisible();
    });
});
