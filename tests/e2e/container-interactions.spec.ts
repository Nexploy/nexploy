import { test, expect } from '@playwright/test';

const CONTAINER = 'e2e-actions-container';
const RENAMED = 'e2e-actions-renamed';
const ACT = { timeout: 40_000 };

test('container interactions through the UI', async ({ page }) => {
    test.setTimeout(180_000);

    const start = page.getByRole('button', { name: 'Start', exact: true });
    const stop = page.getByRole('button', { name: 'Stop', exact: true });
    const pause = page.getByRole('button', { name: 'Pause', exact: true });
    const restart = page.getByRole('button', { name: 'Restart', exact: true });
    const resume = page.getByRole('button', { name: 'Resume', exact: true });
    const toolbarBtn = (name: string) =>
        page.getByRole('button', { name }).filter({ visible: true }).first();

    await test.step('open the container detail page', async () => {
        await page.goto('/docker/containers');
        await page.getByRole('link', { name: CONTAINER }).click();
        await expect(page).toHaveURL(/\/docker\/containers\/[a-f0-9]+/, ACT);
        await expect(page.getByRole('heading', { name: CONTAINER })).toBeVisible(ACT);
    });

    await test.step('stop the container', async () => {
        await expect(stop).toBeEnabled(ACT);
        await stop.click();
        await expect(start).toBeEnabled(ACT);
    });

    await test.step('start the container', async () => {
        await start.click();
        await expect(stop).toBeEnabled(ACT);
    });

    await test.step('restart the container', async () => {
        await restart.click();
        await expect(stop).toBeEnabled(ACT);
        await expect(start).toBeDisabled(ACT);
    });

    await test.step('pause and resume the container', async () => {
        await pause.click();
        await expect(resume).toBeVisible(ACT);
        await resume.click();
        await expect(pause).toBeEnabled(ACT);
    });

    await test.step('open and close the logs panel', async () => {
        await toolbarBtn('Logs').click();
        await expect(page.getByRole('dialog')).toBeVisible(ACT);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();
    });

    await test.step('open and close the stats panel', async () => {
        await toolbarBtn('Stats').click();
        await expect(page.getByRole('dialog')).toBeVisible(ACT);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();
    });

    await test.step('console and attach actions are available', async () => {
        await expect(toolbarBtn('Console')).toBeVisible();
        await expect(toolbarBtn('Attach')).toBeVisible();
    });

    await test.step('rename the container', async () => {
        await page.getByRole('heading', { name: CONTAINER }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await dialog.getByLabel('Container Name').fill(RENAMED);
        await dialog.getByRole('button', { name: 'Rename', exact: true }).click();
        await expect(page.getByRole('heading', { name: RENAMED })).toBeVisible(ACT);
    });

    await test.step('delete the container', async () => {
        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        await page.getByRole('switch').click();
        await page.getByRole('button', { name: 'Remove', exact: true }).click();
        await expect(page).toHaveURL(/\/docker\/containers$/, ACT);
        await expect(page.getByRole('link', { name: RENAMED })).toHaveCount(0, ACT);
    });
});
