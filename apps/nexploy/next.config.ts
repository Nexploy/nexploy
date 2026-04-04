import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import fs from 'fs';

const rootPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf-8'));

const nextConfig: NextConfig = {
    env: {
        appVersion: rootPackage.version,
    },
    reactStrictMode: true,
    transpilePackages: ['@workspace/ui', '@workspace/i18n', '@workspace/shared'],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
