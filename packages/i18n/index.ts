import enCommon from './locales/en/common.json';
import enValidation from './locales/en/validation.json';
import enAuth from './locales/en/auth.json';
import enNavigation from './locales/en/navigation.json';
import enSwarm from './locales/en/swarm.json';
import enDocker from './locales/en/docker.json';
import enAdmin from './locales/en/admin.json';
import enIntegrations from './locales/en/integrations.json';
import enNotifications from './locales/en/notifications.json';
import enRepository from './locales/en/repository.json';
import enAccount from './locales/en/account.json';
import enMonitoring from './locales/en/monitoring.json';
import enAi from './locales/en/ai.json';
import enRequests from './locales/en/requests.json';

import frCommon from './locales/fr/common.json';
import frValidation from './locales/fr/validation.json';
import frAuth from './locales/fr/auth.json';
import frNavigation from './locales/fr/navigation.json';
import frSwarm from './locales/fr/swarm.json';
import frDocker from './locales/fr/docker.json';
import frAdmin from './locales/fr/admin.json';
import frIntegrations from './locales/fr/integrations.json';
import frNotifications from './locales/fr/notifications.json';
import frRepository from './locales/fr/repository.json';
import frAccount from './locales/fr/account.json';
import frMonitoring from './locales/fr/monitoring.json';
import frAi from './locales/fr/ai.json';
import frRequests from './locales/fr/requests.json';

export const locales = {
    en: {
        common: enCommon,
        validation: enValidation,
        auth: enAuth,
        navigation: enNavigation,
        swarm: enSwarm,
        docker: enDocker,
        admin: enAdmin,
        integrations: enIntegrations,
        notifications: enNotifications,
        repository: enRepository,
        account: enAccount,
        monitoring: enMonitoring,
        ai: enAi,
        requests: enRequests,
    },
    fr: {
        common: frCommon,
        validation: frValidation,
        auth: frAuth,
        navigation: frNavigation,
        swarm: frSwarm,
        docker: frDocker,
        admin: frAdmin,
        integrations: frIntegrations,
        notifications: frNotifications,
        repository: frRepository,
        account: frAccount,
        monitoring: frMonitoring,
        ai: frAi,
        requests: frRequests,
    },
};

export const appLocales = ['en', 'fr'] as const;
export type AppLocale = (typeof appLocales)[number];
export const defaultLocale: AppLocale = 'en';

type NestedRecord = { [key: string]: string | NestedRecord };

function getNestedValue(obj: NestedRecord, path: string): string | undefined {
    const keys = path.split('.');
    let current: string | NestedRecord = obj;

    for (const key of keys) {
        if (current === undefined || current === null || typeof current === 'string') {
            return undefined;
        }
        const next: string | NestedRecord | undefined = current[key];
        if (next === undefined) return undefined;
        current = next;
    }

    return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        return key in params ? String(params[key]) : `{${key}}`;
    });
}

export type TranslatorFn = (key: string, params?: Record<string, string | number>) => string;

export function createTranslator(locale: string, namespace?: string): TranslatorFn {
    const resolvedLocale: AppLocale = appLocales.includes(locale as AppLocale)
        ? (locale as AppLocale)
        : defaultLocale;

    const messages = locales[resolvedLocale] as Record<string, NestedRecord>;
    const fallbackMessages =
        resolvedLocale !== defaultLocale
            ? (locales[defaultLocale] as Record<string, NestedRecord>)
            : null;

    return (key: string, params?: Record<string, string | number>): string => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        const [ns, ...rest] = fullKey.split('.');
        const nestedKey = rest.join('.');

        const nsMessages = ns !== undefined ? messages[ns] : undefined;
        let value = nsMessages ? getNestedValue(nsMessages, nestedKey) : undefined;

        if (value === undefined && fallbackMessages) {
            const nsFallback = ns !== undefined ? fallbackMessages[ns] : undefined;
            value = nsFallback ? getNestedValue(nsFallback, nestedKey) : undefined;
        }

        if (value === undefined) {
            return fullKey;
        }

        return interpolate(value, params);
    };
}
