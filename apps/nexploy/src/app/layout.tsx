import '@workspace/ui/globals.css';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const fontSans = Geist({
    subsets: ['latin'],
    variable: '--font-sans',
});

const fontMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <script
                async
                crossOrigin="anonymous"
                src="https://tweakcn.com/live-preview.min.js"
            />
        </head>
        <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
