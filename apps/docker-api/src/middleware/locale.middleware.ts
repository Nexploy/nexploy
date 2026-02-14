import { createMiddleware } from 'hono/factory';
import {
    type AppLocale,
    appLocales,
    createTranslator,
    defaultLocale,
    type TranslatorFn,
} from '@workspace/i18n';

type LocaleEnv = {
    Variables: {
        locale: AppLocale;
    };
};

function parseAcceptLanguage(header: string | undefined): AppLocale {
    if (!header) return defaultLocale;

    const locales = header
        .split(',')
        .map((part) => {
            const [lang, q] = part.trim().split(';q=');
            return { lang: lang.trim().split('-')[0], q: q ? parseFloat(q) : 1 };
        })
        .sort((a, b) => b.q - a.q);

    for (const { lang } of locales) {
        if (appLocales.includes(lang as AppLocale)) {
            return lang as AppLocale;
        }
    }

    return defaultLocale;
}

export const localeMiddleware = createMiddleware<LocaleEnv>(async (c, next) => {
    const locale = parseAcceptLanguage(c.req.header('Accept-Language'));
    c.set('locale', locale);
    await next();
});

export function getTranslations(
    c: { get: (key: 'locale') => AppLocale },
    namespace?: string,
): TranslatorFn {
    const locale = c.get('locale') ?? defaultLocale;
    return createTranslator(locale, namespace);
}
