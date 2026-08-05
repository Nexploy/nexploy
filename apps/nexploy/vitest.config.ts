import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: 'node',
        server: {
            deps: {
                inline: [/@nexploy\/nodes/, /@nexploy\/shared/],
            },
        },
        globals: true,
        include: ['tests/**/*.test.ts'],
        setupFiles: ['./tests/setup/vitest.setup.ts'],
        globalSetup: ['./tests/setup/global-setup.ts'],
        fileParallelism: false,
        testTimeout: 30_000,
        hookTimeout: 60_000,
        reporters: process.env.CI ? ['default', 'junit'] : ['default'],
        outputFile: { junit: './.vitest/junit.xml' },
    },
});
