import enDocker from '@workspace/i18n/locales/en/docker.json';
import frDocker from '@workspace/i18n/locales/fr/docker.json';

type Locale = 'en' | 'fr';

const translations: Record<Locale, typeof enDocker> = {
    en: enDocker,
    fr: frDocker,
};

export function getLocale(): Locale {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(\w+)/);
    if (match && match[1] === 'fr') return 'fr';
    return 'en';
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
        return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }

    return value;
}
