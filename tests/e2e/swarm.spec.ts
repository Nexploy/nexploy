import { test, expect } from '@playwright/test';

const SHOW = { timeout: 30_000 };

test('swarm overview, nodes, services and service deletion via the UI', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/swarm');
    await expect(page.getByRole('heading', { name: 'Docker Swarm' })).toBeVisible(SHOW);
    await expect(page.getByRole('link', { name: 'Create Service' })).toBeVisible(SHOW);

    await test.step('nodes tab lists a node', async () => {
        await page.getByRole('tab', { name: /Nodes/ }).click();
        await expect(page.getByRole('row').nth(1)).toBeVisible(SHOW);
    });

    await test.step('services tab lists the seeded service', async () => {
        await page.getByRole('tab', { name: /Services/ }).click();
        await expect(page.getByText('e2e-sample-service').first()).toBeVisible(SHOW);
    });

    await test.step('delete the service', async () => {
        const row = page.getByRole('row').filter({ hasText: 'e2e-sample-service' });
        await row.getByRole('button').last().click();
        await page.getByRole('menuitem', { name: 'Remove Service' }).click();
        await page.getByRole('button', { name: 'Remove Service', exact: true }).click();
        await expect(
            page.getByRole('row').filter({ hasText: 'e2e-sample-service' }),
        ).toHaveCount(0, SHOW);
    });
});
