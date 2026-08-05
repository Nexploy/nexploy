import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { SheetProvider } from '@/providers/SheetProvider';
import { AlertConfirmationDialog } from '@/components/dialog/AlertConfirmationDialog';
import { ConfirmationDialog } from '@/components/dialog/ConfirmationDialog';
import TailwindBreakpointIndicator from '@workspace/ui/components/utils/TailwindBreakpointIndicator';
import { NuqsAdapter } from 'nuqs/adapters/next';
import { Toaster } from '@/components/shared/toaster/Toaster';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
            <NuqsAdapter>
                <ThemeProvider>
                    {children}
                    <SheetProvider />
                    <Toaster />
                    <AlertConfirmationDialog />
                    <ConfirmationDialog />
                    <TailwindBreakpointIndicator />
                </ThemeProvider>
            </NuqsAdapter>
        </NextIntlClientProvider>
    );
}
