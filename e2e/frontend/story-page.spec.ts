import { expect, test } from '@playwright/test';
import { STORY_PAGE_SLUG } from '../helpers/fixtures';

// Story pages render two donate buttons (mobile summary + desktop sticky
// card). Regardless of how many triggers exist, only a single donate drawer
// may ever be mounted/opened — see the ?open=donate duplicate-drawer bug.
test.describe('Donation page (story)', () => {
    test('loads with correct page title', async ({ page }) => {
        await page.goto(`/${STORY_PAGE_SLUG}`);
        const title = page.getByRole('heading', {
            name: 'E2E Story Fundraiser',
        });
        await expect(title).toBeVisible();
    });

    test('?open=donate opens exactly one donate drawer', async ({ page }) => {
        await page.goto(`/${STORY_PAGE_SLUG}?open=donate`);

        const dialogs = page.locator('[role="dialog"]');
        await expect(dialogs.first()).toBeVisible({ timeout: 10_000 });
        await expect(dialogs).toHaveCount(1);
    });

    test('?open=donate opens exactly one donate drawer on mobile viewport', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`/${STORY_PAGE_SLUG}?open=donate`);

        const dialogs = page.locator('[role="dialog"]');
        await expect(dialogs.first()).toBeVisible({ timeout: 10_000 });
        await expect(dialogs).toHaveCount(1);
    });

    test('clicking the visible Donate button opens a single donate drawer', async ({
        page,
    }) => {
        await page.goto(`/${STORY_PAGE_SLUG}`);
        // Wait for JS hydration so client components (DonateButton) are interactive
        await page.waitForLoadState('networkidle');

        await page
            .getByRole('button', { name: 'Donate', exact: true })
            .filter({ visible: true })
            .click();

        const dialogs = page.locator('[role="dialog"]');
        await expect(dialogs.first()).toBeVisible({ timeout: 5_000 });
        await expect(dialogs).toHaveCount(1);

        // Verify amount presets appear inside the drawer.
        await expect(
            dialogs.first().getByText('$10', { exact: true }),
        ).toBeVisible();
    });
});
