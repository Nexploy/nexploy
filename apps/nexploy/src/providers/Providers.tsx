import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@workspace/ui/components/sonner';
import { CookiesToaster } from '@/components/utils/cookiesToaster/CookiesToaster';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
            <ThemeProvider>
                {children}
                <Toaster/>
                <Suspense>
                    <CookiesToaster/>
                </Suspense>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
