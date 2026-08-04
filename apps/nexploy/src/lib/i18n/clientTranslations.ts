import enDocker from '@workspace/i18n/locales/en/docker.json';
import frDocker from '@workspace/i18n/locales/fr/docker.json';
import itDocker from '@workspace/i18n/locales/it/docker.json';
import esDocker from '@workspace/i18n/locales/es/docker.json';

type Locale = 'en' | 'fr' | 'it' | 'es';

const translations: Record<Locale, typeof enDocker> = {
    en: enDocker,
    fr: frDocker,
    it: itDocker,
    es: esDocker,
};

const supportedLocales = new Set<string>(['en', 'fr', 'it', 'es']);

export function getLocale(): Locale {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([\w-]+)/);
    const value = match?.[1];
    return value && supportedLocales.has(value) ? (value as Locale) : 'en';
}

export function clientT(key: string, params?: Record<string, string | number>): string {
    const locale = getLocale();
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
        value = value?.[k];
    }

    if (typeof value !== 'string') return key;

    if (params) {
        return value.replace(/\{(\w+)\}/g, (_, k) => `${params[k] ?? `{${k}}`}`);
    }

    return value;
}
