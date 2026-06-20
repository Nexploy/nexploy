import { expect, test } from '@playwright/test';

test.describe('authenticated app', () => {
    test('renders the repositories page', async ({ page }) => {
        await page.goto('/repositories');

        await expect(page).toHaveURL(/\/repositories/);
        await expect(page.getByRole('heading', { name: 'Repositories' })).toBeVisible();
    });

    test('renders the docker containers page', async ({ page }) => {
        await page.goto('/docker/containers');

        await expect(page).toHaveURL(/\/docker\/containers/);
        await expect(page.getByRole('main')).toBeVisible();
    });
});

test.describe('auth pages', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('sign-in page renders its form', async ({ page }) => {
        await page.goto('/signin');

        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
    });
});
