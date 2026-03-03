import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        testTimeout: 30000,
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/routes/**/*.ts'],
            exclude: ['src/routes/**/*Events.ts'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@workspace/i18n': path.resolve(__dirname, '../../packages/i18n/src'),
            '@workspace/schemas-zod': path.resolve(__dirname, '../../packages/schemas-zod/src'),
            '@workspace/typescript-interface': path.resolve(
                __dirname,
                '../../packages/typescript-interface/src',
            ),
            '@workspace/shared': path.resolve(__dirname, '../../packages/shared/src'),
        },
    },
});
