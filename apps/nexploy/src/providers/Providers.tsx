import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { GlobalSheet } from '@/providers/GlobalSheet';
import { Toaster } from '@/components/utils/toaster/Toaster';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
            <ThemeProvider>
                {children}
                <GlobalSheet />
                <Suspense>
                    <Toaster />
                </Suspense>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
