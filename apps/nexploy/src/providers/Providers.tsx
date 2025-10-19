import { ThemeProvider } from '@/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@workspace/ui/components/sonner';
import { GlobalSheet } from '@/providers/GlobalSheet';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider>
            <ThemeProvider>
                {children}
                <GlobalSheet />
                <Toaster />
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
