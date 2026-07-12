import '@workspace/ui/globals.css';
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { Providers } from '@/providers/Providers';
import type { Metadata } from 'next';

const fontDisplay = Archivo({
    subsets: ['latin'],
    weight: ['600', '700', '800'],
    variable: '--font-archivo',
});

const fontSans = IBM_Plex_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-plex-sans',
});

const fontMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-plex-mono',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://nexploy.app'),
    title: {
        default: 'Nexploy - Docker Container Management Platform',
        template: '%s | Nexploy',
    },
    description:
        'Nexploy is a powerful Docker container management platform that simplifies deployment, monitoring, and orchestration of containerized applications.',
    keywords: [
        'docker',
        'container management',
        'deployment',
        'devops',
        'orchestration',
        'nexploy',
        'docker compose',
        'container monitoring',
    ],
    authors: [{ name: 'Nexploy' }],
    creator: 'Nexploy',
    publisher: 'Nexploy',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://nexploy.app',
        siteName: 'Nexploy',
        title: 'Nexploy - Docker Container Management Platform',
        description:
            'Powerful Docker container management platform for deployment, monitoring, and orchestration.',
        images: [
            {
                url: '/assets/nexploy-logo.svg',
                width: 1200,
                height: 630,
                alt: 'Nexploy Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Nexploy - Docker Container Management Platform',
        description:
            'Powerful Docker container management platform for deployment, monitoring, and orchestration.',
        images: ['/assets/nexploy-logo.svg'],
    },
    icons: {
        icon: '/assets/nexploy-logo.svg',
        shortcut: '/assets/nexploy-logo.svg',
        apple: '/assets/nexploy-logo.svg',
    },
    manifest: '/manifest.json',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
