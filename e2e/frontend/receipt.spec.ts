import { expect, test } from '@playwright/test';
import { BASE_URL, TEST_DONATION_ID } from '../helpers/fixtures';

test.describe('Receipt route', () => {
    test('valid donation ID returns a PDF response', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/receipts/${TEST_DONATION_ID}`,
        );

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('pdf');
    });

    test('invalid donation ID returns an error', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/receipts/dn_does_not_exist`,
        );

        // Should return a non-200 status (likely 404 or 500 via handleErrors)
        expect(response.status()).not.toBe(200);
    });
});
