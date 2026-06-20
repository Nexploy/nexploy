import { test, expect, type Page } from '@playwright/test';

const SHOW = { timeout: 30_000 };

async function deleteRowResource(page: Page, name: string) {
    const row = page.getByRole('row').filter({ hasText: name });
    await row.getByRole('button').last().click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0, SHOW);
}

test.describe('docker resources create/delete via the UI', () => {
    test('volume: create then delete', async ({ page }) => {
        const name = 'e2e-ui-volume';
        await page.goto('/docker/volumes/create');
        await page.getByPlaceholder('my-volume').fill(name);
        await page.getByRole('button', { name: 'Create Volume' }).click();

        await expect(page).toHaveURL(/\/docker\/volumes$/, SHOW);
        await expect(page.getByText(name).first()).toBeVisible(SHOW);

        await deleteRowResource(page, name);
    });

    test('network: create then delete', async ({ page }) => {
        const name = 'e2e-ui-network';
        await page.goto('/docker/networks/create');
        await page.getByPlaceholder('my-network').fill(name);
        await page.getByRole('button', { name: 'Create Network' }).click();

        await expect(page).toHaveURL(/\/docker\/networks$/, SHOW);
        await expect(page.getByText(name).first()).toBeVisible(SHOW);

        await deleteRowResource(page, name);
    });

    test('image: pull then delete', async ({ page }) => {
        test.setTimeout(120_000);
        const ref = 'busybox';
        await page.goto('/docker/images/pull');
        await page.getByPlaceholder('image:tag').fill('busybox:latest');
        await page.getByRole('button', { name: 'Download image' }).click();

        await expect(page).toHaveURL(/\/docker\/images\/.+/, { timeout: 60_000 });

        await page.goto('/docker/images');
        await expect(page.getByText(ref).first()).toBeVisible(SHOW);

        await deleteRowResource(page, ref);
    });
});
