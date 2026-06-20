import { test, expect } from '@playwright/test';

const SHOW = { timeout: 25_000 };

test.describe('docker-api via the front-end', () => {
    test('containers page lists the running container', async ({ page }) => {
        await page.goto('/docker/containers');
        await expect(page).toHaveURL(/\/docker\/containers/);
        await expect(page.getByText('e2e-sample-container').first()).toBeVisible(SHOW);
    });

    test('images page lists the pulled image', async ({ page }) => {
        await page.goto('/docker/images');
        await expect(page).toHaveURL(/\/docker\/images/);
        await expect(page.getByText(/alpine/).first()).toBeVisible(SHOW);
    });

    test('volumes page lists the created volume', async ({ page }) => {
        await page.goto('/docker/volumes');
        await expect(page).toHaveURL(/\/docker\/volumes/);
        await expect(page.getByText('e2e-sample-volume').first()).toBeVisible(SHOW);
    });

    test('networks page lists the created network', async ({ page }) => {
        await page.goto('/docker/networks');
        await expect(page).toHaveURL(/\/docker\/networks/);
        await expect(page.getByText('e2e-sample-network').first()).toBeVisible(SHOW);
    });
});
