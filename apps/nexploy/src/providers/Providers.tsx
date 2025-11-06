import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { SheetProvider } from '@/providers/SheetProvider';
import { Toaster } from '@/components/utils/toaster/Toaster';
import { Suspense } from 'react';
import { AlertConfirmationDialog } from '@/components/dialog/AlertConfirmationDialog';
import { ConfirmationDialog } from '@/components/dialog/ConfirmationDialog';
import TailwindBreakpointIndicator from '@workspace/ui/components/utils/TailwindBreakpointIndicator';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
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
        </NextIntlClientProvider>
    );
}
