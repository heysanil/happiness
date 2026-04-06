import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
    test('displays the logo image', async ({ page }) => {
        await page.goto('/');

        const logo = page.getByRole('img', { name: /logo/i });
        await expect(logo).toBeVisible();
    });

    test('displays the app name as a heading', async ({ page }) => {
        await page.goto('/');

        const heading = page.getByRole('heading', { level: 1 });
        await expect(heading).toBeVisible();
        // The heading text comes from HappinessConfig.name (default: "Happiness")
        await expect(heading).toHaveText(/.+/);
    });

    test('has a donor login link that navigates to /portal', async ({
        page,
    }) => {
        await page.goto('/');

        const portalLink = page.getByRole('link', { name: /donor login/i });
        await expect(portalLink).toBeVisible();
        await expect(portalLink).toHaveAttribute('href', '/portal');

        await portalLink.click();
        await page.waitForURL('**/portal');
        expect(page.url()).toContain('/portal');
    });
});
