import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';

test.describe
    .serial('Presets frontend rendering', () => {
        let tierPageId: string;
        let gridPageId: string;
        const tierSlug = 'e2e-presets-tier-fe';
        const gridSlug = 'e2e-presets-grid-fe';

        const tierPresets = [
            {
                amount: 1500,
                name: 'Friend',
                description: 'A small gesture of support',
            },
            {
                amount: 5000,
                name: 'Advocate',
                description: 'Champion our mission',
            },
            {
                amount: 15000,
                name: 'Leader',
                description: 'Make a transformative impact',
            },
        ];

        const gridPresets = [
            { amount: 700 },
            { amount: 1500 },
            { amount: 3000 },
            { amount: 8000 },
        ];

        test.beforeAll(async () => {
            // Create test pages with presets via API
            const tierRes = await api.createPage({
                slug: tierSlug,
                kind: 'simple',
                name: 'Tier View Test',
                title: 'Tier View Fundraiser',
                status: 'published',
                presets: tierPresets,
            });
            tierPageId = (tierRes.data as Record<string, string>).id;

            const gridRes = await api.createPage({
                slug: gridSlug,
                kind: 'simple',
                name: 'Grid View Test',
                title: 'Grid View Fundraiser',
                status: 'published',
                presets: gridPresets,
            });
            gridPageId = (gridRes.data as Record<string, string>).id;
        });

        test.afterAll(async () => {
            await api.deletePage(tierPageId);
            await api.deletePage(gridPageId);
        });

        // -- Tier view tests --

        test('tier view — shows preset names in drawer', async ({ page }) => {
            await page.goto(`/${tierSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            await expect(drawer.getByText('Friend')).toBeVisible();
            await expect(drawer.getByText('Advocate')).toBeVisible();
            await expect(drawer.getByText('Leader')).toBeVisible();
        });

        test('tier view — shows preset descriptions', async ({ page }) => {
            await page.goto(`/${tierSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            await expect(
                drawer.getByText('A small gesture of support'),
            ).toBeVisible();
            await expect(
                drawer.getByText('Champion our mission'),
            ).toBeVisible();
            await expect(
                drawer.getByText('Make a transformative impact'),
            ).toBeVisible();
        });

        test('tier view — shows formatted amounts', async ({ page }) => {
            await page.goto(`/${tierSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            await expect(
                drawer.getByText('$15', { exact: true }),
            ).toBeVisible();
            await expect(
                drawer.getByText('$50', { exact: true }),
            ).toBeVisible();
            await expect(
                drawer.getByText('$150', { exact: true }),
            ).toBeVisible();
        });

        test('tier view — clicking a tier updates the total', async ({
            page,
        }) => {
            await page.goto(`/${tierSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            const continueButton = drawer.getByRole('button', {
                name: /continue to payment/i,
            });

            // Capture the initial total (first preset selected by default)
            const initialText = await continueButton.textContent();

            // Click the "Leader" tier ($150) — should change the total
            await drawer.getByText('Leader').click();
            await expect(continueButton).not.toHaveText(initialText!);
        });

        test('tier view — Other option is visible and works', async ({
            page,
        }) => {
            await page.goto(`/${tierSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            // In tier view, "Other" is a card radio option, not a button
            await drawer.getByText('Other', { exact: true }).click();
            const customInput = drawer.getByPlaceholder('Enter amount');
            await expect(customInput).toBeVisible();
        });

        test('tier view — does not show default preset amounts', async ({
            page,
        }) => {
            await page.goto(`/${tierSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            // Default amounts ($10, $25, $100, $250) should NOT appear
            await expect(
                drawer.getByText('$10', { exact: true }),
            ).not.toBeVisible();
            await expect(
                drawer.getByText('$25', { exact: true }),
            ).not.toBeVisible();
            await expect(
                drawer.getByText('$250', { exact: true }),
            ).not.toBeVisible();
        });

        // -- Grid view tests (presets without names) --

        test('grid view — shows custom amounts without tier names', async ({
            page,
        }) => {
            await page.goto(`/${gridSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            // Custom grid amounts
            await expect(drawer.getByText('$7', { exact: true })).toBeVisible();
            await expect(
                drawer.getByText('$15', { exact: true }),
            ).toBeVisible();
            await expect(
                drawer.getByText('$30', { exact: true }),
            ).toBeVisible();
            await expect(
                drawer.getByText('$80', { exact: true }),
            ).toBeVisible();
        });

        test('grid view — does not show default amounts', async ({ page }) => {
            await page.goto(`/${gridSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            // Default amounts should NOT appear
            await expect(
                drawer.getByText('$10', { exact: true }),
            ).not.toBeVisible();
            await expect(
                drawer.getByText('$25', { exact: true }),
            ).not.toBeVisible();
            await expect(
                drawer.getByText('$100', { exact: true }),
            ).not.toBeVisible();
        });

        test('grid view — does not show tier names', async ({ page }) => {
            await page.goto(`/${gridSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            // No tier names should appear (grid presets have no names)
            await expect(drawer.getByText('Friend')).not.toBeVisible();
            await expect(drawer.getByText('Advocate')).not.toBeVisible();
        });

        test('grid view — first preset is selected by default', async ({
            page,
        }) => {
            await page.goto(`/${gridSlug}`);
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /donate/i }).click();
            const drawer = page.getByRole('dialog');
            await expect(drawer).toBeVisible({ timeout: 5_000 });

            // Continue button should be enabled (first preset auto-selected)
            await expect(
                drawer.getByRole('button', { name: /continue to payment/i }),
            ).toBeEnabled();
        });
    });
