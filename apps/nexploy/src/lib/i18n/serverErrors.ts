import { getLocale } from 'next-intl/server';
import { createTranslator, defaultLocale, type TranslatorFn } from '@workspace/i18n';

export async function getErrorTranslator(): Promise<TranslatorFn> {
    let locale: string = defaultLocale;
    try {
        locale = await getLocale();
    } catch {
        locale = defaultLocale;
    }
    return createTranslator(locale, 'errors');
}
