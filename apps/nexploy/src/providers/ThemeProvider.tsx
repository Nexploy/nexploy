import { ThemeProvider as NextThemesProvider } from '@wrksz/themes/next';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
        >
            {children}
        </NextThemesProvider>
    );
}
