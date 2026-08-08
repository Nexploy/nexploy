import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    output: 'standalone',
    env: {
        NEXT_PUBLIC_DOCKER_SOCKET: process.env.DOCKER_SOCKET ?? '/var/run/docker.sock',
    },
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
    experimental: {
        useTypeScriptCli: true,
    },
    reactStrictMode: true,
    transpilePackages: ['@workspace/ui', '@workspace/i18n'],
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
