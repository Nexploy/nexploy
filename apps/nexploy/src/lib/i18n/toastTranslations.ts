import enDocker from '@workspace/i18n/locales/en/docker.json';
import frDocker from '@workspace/i18n/locales/fr/docker.json';

type Locale = 'en' | 'fr';

const translations: Record<Locale, typeof enDocker> = {
    en: enDocker,
    fr: frDocker,
};

export function getLocale(): Locale {
    if (typeof window === 'undefined') return 'en';

    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(\w+)/);
    if (match && match[1] === 'fr') return 'fr';
    return 'en';
}

export function toastT(key: string, params?: Record<string, string | number>): string {
    const locale = getLocale();
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
