export interface InstanceDomainSettings {
    domain: string;
    useTls: boolean;
    acmeEmail: string;
}

export function getInstanceDomainSettings(): InstanceDomainSettings | null {
    if (!process.env.TRAEFIK_STATIC_CONFIG_PATH) return null;

    const publicUrl = process.env.NEXPLOY_URL ?? process.env.BETTER_AUTH_URL ?? '';
    const domain = publicUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    return {
        domain,
        useTls: process.env.TRAEFIK_USE_TLS !== 'false',
        acmeEmail: process.env.ACME_EMAIL ?? '',
    };
}
