import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const workspaceRoot = path.join(__dirname, '..', '..', '..');

const nextConfig: NextConfig = {
    output: 'standalone',
    turbopack: {
        root: workspaceRoot,
    },
    outputFileTracingRoot: workspaceRoot,
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
    transpilePackages: [
        '@workspace/ui',
        '@workspace/i18n',
        '@workspace/shared',
        '@nexploy/node-core',
        '@nexploy/node-ui',
        '@nexploy/nodes',
    ],
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
