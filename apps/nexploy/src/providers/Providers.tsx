import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { SheetProvider } from '@/providers/SheetProvider';
import { Toaster } from '@/components/shared/toaster/Toaster';
import { Suspense } from 'react';
import { AlertConfirmationDialog } from '@/components/dialog/AlertConfirmationDialog';
import { ConfirmationDialog } from '@/components/dialog/ConfirmationDialog';
import TailwindBreakpointIndicator from '@workspace/ui/components/utils/TailwindBreakpointIndicator';
import { NuqsAdapter } from 'nuqs/adapters/next';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
            <NuqsAdapter>
                <ThemeProvider>
                    {children}
                    <SheetProvider />
                    <Suspense>
                        <Toaster />
                    </Suspense>
                    <AlertConfirmationDialog />
                    <ConfirmationDialog />
                    <TailwindBreakpointIndicator />
                </ThemeProvider>
            </NuqsAdapter>
        </NextIntlClientProvider>
    );
}
