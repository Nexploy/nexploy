import { test, expect } from '@playwright/test';

const STACK = 'e2estack';
const COMPOSE = `services:
  web:
    image: alpine:latest
    command: ["sleep", "3600"]
`;

test('deploy a compose stack via the UI', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/docker/containers/stacks/create');
    await page.getByPlaceholder('my-stack').fill(STACK);
    await page.locator('input[type="file"]').setInputFiles({
        name: 'compose.yaml',
        mimeType: 'text/yaml',
        buffer: Buffer.from(COMPOSE),
    });
    await page.getByRole('button', { name: 'Deploy Stack' }).click();

    await expect(page).toHaveURL(/\/docker\/containers$/, { timeout: 90_000 });
    await expect(page.getByText(STACK).first()).toBeVisible({ timeout: 30_000 });
});
