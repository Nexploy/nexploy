import { expect, test as setup } from '@playwright/test';
import { ADMIN, AUTH_FILE } from './constants';

setup('authenticate', async ({ page }) => {
    await page.goto('/setup');
    const createAdminBtn = page.getByRole('button', {
        name: 'Create Administrator Account',
    });
    if (await createAdminBtn.isVisible().catch(() => false)) {
        await page.getByLabel('Name').fill(ADMIN.name);
        await page.getByLabel('Email', { exact: true }).fill(ADMIN.email);
        await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
        await page.getByLabel('Confirm Password').fill(ADMIN.password);
        await createAdminBtn.click();
        await page
            .waitForURL((url) => url.pathname !== '/setup', { timeout: 15_000 })
            .catch(() => {});
    }

    const path = new URL(page.url()).pathname;
    if (path === '/setup' || path === '/signin') {
        await page.goto('/signin');
        await page.getByLabel('Email').fill(ADMIN.email);
        await page.getByLabel('Password').fill(ADMIN.password);
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await page.waitForURL(/\/repositories/, { timeout: 15_000 });
    }

    await expect(page).not.toHaveURL(/\/(setup|signin)$/);
    await page.context().storageState({ path: AUTH_FILE });
});
