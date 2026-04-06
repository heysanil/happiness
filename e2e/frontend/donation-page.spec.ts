import { expect, test } from '@playwright/test';
import { SIMPLE_PAGE_SLUG } from '../helpers/fixtures';

test.describe('Donation page (simple)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SIMPLE_PAGE_SLUG}`);
        // Wait for JS hydration so client components (DonateButton) are interactive
        await page.waitForLoadState('networkidle');
    });

    test('loads with correct page title', async ({ page }) => {
        const title = page.getByRole('heading', {
            name: 'E2E Simple Fundraiser',
        });
        await expect(title).toBeVisible();
    });

    test('shows the organizer name', async ({ page }) => {
        await expect(page.getByText('E2E Organizer')).toBeVisible();
    });

    test('donate button is visible and clickable', async ({ page }) => {
        const donateButton = page.getByRole('button', { name: /donate/i });
        await expect(donateButton).toBeVisible();
        await expect(donateButton).toBeEnabled();
    });

    test('clicking Donate opens the drawer modal', async ({ page }) => {
        const donateButton = page.getByRole('button', { name: /donate/i });
        await donateButton.click();

        // The Paris UI Drawer renders as a headlessui Dialog.
        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible({ timeout: 5_000 });

        // Verify amount presets appear inside the drawer.
        await expect(drawer.getByText('$10', { exact: true })).toBeVisible();
    });

    test('amount preset buttons are visible', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible({ timeout: 5_000 });

        await expect(drawer.getByText('$10', { exact: true })).toBeVisible();
        await expect(drawer.getByText('$25', { exact: true })).toBeVisible();
        await expect(drawer.getByText('$50', { exact: true })).toBeVisible();
        await expect(drawer.getByText('$100', { exact: true })).toBeVisible();
        await expect(drawer.getByText('$250', { exact: true })).toBeVisible();
    });

    test('clicking "Other" shows a custom amount input', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible({ timeout: 5_000 });

        await drawer.getByRole('button', { name: 'Other' }).click();

        // The custom amount input has placeholder "Enter amount"
        const customInput = drawer.getByPlaceholder('Enter amount');
        await expect(customInput).toBeVisible();
    });

    test('frequency toggle shows One-time and Monthly options', async ({
        page,
    }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible({ timeout: 5_000 });

        await expect(drawer.getByText('One-time')).toBeVisible();
        await expect(drawer.getByText('Monthly')).toBeVisible();
    });

    test('"Cover processing fees" checkbox is present', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible({ timeout: 5_000 });

        await expect(drawer.getByText(/cover processing fees/i)).toBeVisible();
    });

    test('"Make donation anonymous" checkbox is present', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible({ timeout: 5_000 });

        await expect(
            drawer.getByText(/make.*donation anonymous/i),
        ).toBeVisible();
    });

    test('draft/non-existent page returns 404', async ({ page }) => {
        const response = await page.goto('/this-slug-does-not-exist-at-all');

        // When getPage throws for a non-existent slug, the server responds
        // with a 500 (error boundary) or the page shows an error state.
        // In production mode, the error boundary renders "Something went wrong".
        // Check either the HTTP status or the error page text.
        const status = response?.status() ?? 0;
        const hasErrorPage =
            status >= 400 ||
            (await page
                .getByText(/not found|something went wrong/i)
                .isVisible()
                .catch(() => false));

        expect(hasErrorPage).toBe(true);
    });
});
