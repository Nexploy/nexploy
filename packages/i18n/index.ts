import enCommon from './locales/en/common.json';
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
import enErrors from './locales/en/errors.json';
import enOrganization from './locales/en/organization.json';

import frCommon from './locales/fr/common.json';
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
import frErrors from './locales/fr/errors.json';
import frOrganization from './locales/fr/organization.json';

import itCommon from './locales/it/common.json';
import itAuth from './locales/it/auth.json';
import itNavigation from './locales/it/navigation.json';
import itSwarm from './locales/it/swarm.json';
import itDocker from './locales/it/docker.json';
import itAdmin from './locales/it/admin.json';
import itIntegrations from './locales/it/integrations.json';
import itNotifications from './locales/it/notifications.json';
import itRepository from './locales/it/repository.json';
import itAccount from './locales/it/account.json';
import itMonitoring from './locales/it/monitoring.json';
import itAi from './locales/it/ai.json';
import itRequests from './locales/it/requests.json';
import itErrors from './locales/it/errors.json';
import itOrganization from './locales/it/organization.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esNavigation from './locales/es/navigation.json';
import esSwarm from './locales/es/swarm.json';
import esDocker from './locales/es/docker.json';
import esAdmin from './locales/es/admin.json';
import esIntegrations from './locales/es/integrations.json';
import esNotifications from './locales/es/notifications.json';
import esRepository from './locales/es/repository.json';
import esAccount from './locales/es/account.json';
import esMonitoring from './locales/es/monitoring.json';
import esAi from './locales/es/ai.json';
import esRequests from './locales/es/requests.json';
import esErrors from './locales/es/errors.json';
import esOrganization from './locales/es/organization.json';

export const locales = {
    en: {
        common: enCommon,
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
        errors: enErrors,
        organization: enOrganization,
    },
    fr: {
        common: frCommon,
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
        errors: frErrors,
        organization: frOrganization,
    },
    it: {
        common: itCommon,
        auth: itAuth,
        navigation: itNavigation,
        swarm: itSwarm,
        docker: itDocker,
        admin: itAdmin,
        integrations: itIntegrations,
        notifications: itNotifications,
        repository: itRepository,
        account: itAccount,
        monitoring: itMonitoring,
        ai: itAi,
        requests: itRequests,
        errors: itErrors,
        organization: itOrganization,
    },
    es: {
        common: esCommon,
        auth: esAuth,
        navigation: esNavigation,
        swarm: esSwarm,
        docker: esDocker,
        admin: esAdmin,
        integrations: esIntegrations,
        notifications: esNotifications,
        repository: esRepository,
        account: esAccount,
        monitoring: esMonitoring,
        ai: esAi,
        requests: esRequests,
        errors: esErrors,
        organization: esOrganization,
    },
};

export const appLocales = ['en', 'fr', 'it', 'es'] as const;
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
        return key in params ? `${params[key]}` : `{${key}}`;
    });
}

export type TranslatorFn = (key: string, params?: Record<string, string | number>) => string;

export function createTranslator(locale: string, namespace?: string): TranslatorFn {
    const resolvedLocale: AppLocale = appLocales.includes(locale as AppLocale) ? (locale as AppLocale) : defaultLocale;

    const messages = locales[resolvedLocale] as Record<string, NestedRecord>;
    const fallbackMessages =
        resolvedLocale !== defaultLocale ? (locales[defaultLocale] as Record<string, NestedRecord>) : null;

    return (key: string, params?: Record<string, string | number>): string => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        const [ns, ...rest] = fullKey.split('.');
        const nestedKey = rest.join('.');

        const nsMessages = ns && messages[ns];
        let value = nsMessages && getNestedValue(nsMessages, nestedKey);

        if (value === undefined && fallbackMessages) {
            const nsFallback = ns && fallbackMessages[ns];
            value = nsFallback && getNestedValue(nsFallback, nestedKey);
        }

        if (value === undefined) {
            return fullKey;
        }

        return interpolate(value, params);
    };
}
