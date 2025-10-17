import { defineRouting } from 'next-intl/routing';
import { locales } from '@workspace/i18n';

export type AppLocale = keyof typeof locales;
export const appLocales = Object.keys(locales) as AppLocale[];

export const defaultLocale: AppLocale = 'en';

export const routing = defineRouting({
    locales: appLocales,
    defaultLocale,
    localePrefix: 'never',
    localeDetection: true,
});
