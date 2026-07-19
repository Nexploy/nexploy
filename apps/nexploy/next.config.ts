import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    output: 'standalone',
    distDir: process.env.NEXT_DIST_DIR || '.next',
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
    serverExternalPackages: [
        'better-auth',
        '@better-auth/api-key',
        '@better-auth/kysely-adapter',
        'kysely',
        '@prisma/client',
        '@prisma/adapter-pg',
        'pg',
    ],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
