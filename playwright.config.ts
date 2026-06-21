import { defineConfig, devices } from '@playwright/test';

const PORT = '3022';
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 120_000,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',

    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on',
    },

    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ },

        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],

    // No `webServer` here: the whole stack (nexploy + docker-api + DB + DinD) is
    // booted and health-checked by scripts/e2e.sh before Playwright runs.
    // Always start the suite via `pnpm test:e2e` (from the repo root).
});
