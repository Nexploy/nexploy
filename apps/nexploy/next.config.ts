import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    transpilePackages: ['@workspace/ui', '@workspace/i18n'],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
