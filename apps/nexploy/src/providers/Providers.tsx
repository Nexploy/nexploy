import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import TailwindBreakpointIndicator from '@workspace/ui/components/utils/TailwindBreakpointIndicator';
import { NuqsAdapter } from 'nuqs/adapters/next';
import { Toaster } from '@/components/shared/toaster/Toaster';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
            <NuqsAdapter>
                <ThemeProvider>
                    {children}
                    <Toaster />
                    <TailwindBreakpointIndicator />
                </ThemeProvider>
            </NuqsAdapter>
        </NextIntlClientProvider>
    );
}
