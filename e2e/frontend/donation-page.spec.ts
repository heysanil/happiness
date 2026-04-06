import { expect, test } from '@playwright/test';
import { SIMPLE_PAGE_SLUG } from '../helpers/fixtures';

test.describe('Donation page (simple)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SIMPLE_PAGE_SLUG}`);
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

        // The Paris UI Drawer renders with a "Donate" title.
        // Wait for amount presets to appear inside the drawer.
        await expect(page.getByText('$10')).toBeVisible({ timeout: 5_000 });
    });

    test('amount preset buttons are visible', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        await expect(page.getByText('$10')).toBeVisible();
        await expect(page.getByText('$25')).toBeVisible();
        await expect(page.getByText('$50')).toBeVisible();
        await expect(page.getByText('$100')).toBeVisible();
        await expect(page.getByText('$250')).toBeVisible();
    });

    test('clicking "Other" shows a custom amount input', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        await page.getByText('Other').click();

        // The custom amount input has placeholder "Enter amount"
        const customInput = page.getByPlaceholder('Enter amount');
        await expect(customInput).toBeVisible();
    });

    test('frequency toggle shows One-time and Monthly options', async ({
        page,
    }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        await expect(page.getByText('One-time')).toBeVisible();
        await expect(page.getByText('Monthly')).toBeVisible();
    });

    test('"Cover processing fees" checkbox is present', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        await expect(page.getByText(/cover processing fees/i)).toBeVisible();
    });

    test('"Make donation anonymous" checkbox is present', async ({ page }) => {
        await page.getByRole('button', { name: /donate/i }).click();

        await expect(page.getByText(/make.*donation anonymous/i)).toBeVisible();
    });

    test('draft/non-existent page returns 404', async ({ page }) => {
        await page.goto('/this-slug-does-not-exist-at-all');

        // The not-found page renders "Page not found" heading text
        await expect(page.getByText(/not found/i)).toBeVisible();
    });
});
