import { test, expect } from '@playwright/test';

test.describe('repositories', () => {
    test('repositories page renders', async ({ page }) => {
        await page.goto('/repositories');
        await expect(page).toHaveURL(/\/repositories/);
        await expect(page.getByRole('heading', { name: 'Repositories' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Add Repository' })).toBeVisible();
    });

    test('repository create page renders the git source step', async ({ page }) => {
        await page.goto('/repositories/create');
        await expect(page).toHaveURL(/\/repositories\/create/);
        await expect(page.getByRole('heading', { name: 'New Repository' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Repository' })).toBeVisible();
    });
});
