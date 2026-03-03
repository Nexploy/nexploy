import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/__tests__/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@workspace/ui': path.resolve(__dirname, '../../packages/ui/src'),
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
