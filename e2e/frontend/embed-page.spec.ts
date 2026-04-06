import { expect, test } from '@playwright/test';
import { SIMPLE_PAGE_SLUG } from '../helpers/fixtures';

test.describe('Embed page', () => {
    test('loads and shows the page title', async ({ page }) => {
        await page.goto(`/${SIMPLE_PAGE_SLUG}/embed`);

        const title = page.getByRole('heading', {
            name: 'E2E Simple Fundraiser',
        });
        await expect(title).toBeVisible();
    });

    test('does not render a navigation bar', async ({ page }) => {
        await page.goto(`/${SIMPLE_PAGE_SLUG}/embed`);

        // The embed page has the nav section commented out, so there should
        // be no <nav> element and no logo in a top bar.
        const nav = page.locator('nav');
        await expect(nav).toHaveCount(0);
    });
});
