import type { NextConfig } from 'next';
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    /* config options here */
    output: 'export', // important → génère les fichiers statiques dans "out/"
    reactStrictMode: true,
    images: {
        unoptimized: true, // évite l’erreur avec le composant <Image> de Next
    },
    trailingSlash: true, // assure que toutes les routes ont un "/" final (utile pour file://)
    assetPrefix: isProd ? './' : '',
};

export default nextConfig;
