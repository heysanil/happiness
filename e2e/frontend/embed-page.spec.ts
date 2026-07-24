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

    test('clicking Donate opens a single donate drawer', async ({ page }) => {
        await page.goto(`/${SIMPLE_PAGE_SLUG}/embed`);
        // Wait for JS hydration so client components (DonateButton) are interactive
        await page.waitForLoadState('networkidle');

        // The simple-page embed renders a real DonateButton, whose drawer is
        // mounted at the page level (DonateDrawer in embed/page.tsx).
        await page.getByRole('button', { name: 'Donate', exact: true }).click();

        const dialogs = page.locator('[role="dialog"]');
        await expect(dialogs.first()).toBeVisible({ timeout: 5_000 });
        await expect(dialogs).toHaveCount(1);
        await expect(
            dialogs.first().getByText('$10', { exact: true }),
        ).toBeVisible();
    });
});
