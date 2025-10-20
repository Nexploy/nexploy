import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { SheetProvider } from '@/providers/SheetProvider';
import { Toaster } from '@/components/utils/toaster/Toaster';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
            <ThemeProvider>
                {children}
                <SheetProvider />
                <Suspense>
                    <Toaster />
                </Suspense>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
