import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import fs from 'fs';

const rootPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf-8'));

const nextConfig: NextConfig = {
    output: 'standalone',
    distDir: process.env.NEXT_DIST_DIR || '.next',
    env: {
        appVersion: rootPackage.version,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
    allowedDevOrigins: ['192.168.1.250'],
    reactStrictMode: true,
    transpilePackages: ['@workspace/ui', '@workspace/i18n', '@workspace/shared'],
    serverExternalPackages: ['better-auth', '@better-auth/kysely-adapter', 'kysely'],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
