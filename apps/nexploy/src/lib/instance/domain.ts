import type { InstanceTlsMode } from '@workspace/schemas-zod/admin/instance.schema';
import { getInstanceCertificateId, getInstanceFallbackIp, resolveInstanceTlsMode } from './tlsMode';

export interface InstanceDomainSettings {
    domain: string;
    mode: InstanceTlsMode;
    acmeEmail: string;
    certificateId: string | null;
    fallbackIp: string | null;
}

export function getInstanceHost(): string {
    const publicUrl = process.env.NEXPLOY_URL ?? process.env.BETTER_AUTH_URL ?? '';
    return publicUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export function getInstanceDomainSettings(): InstanceDomainSettings | null {
    if (!process.env.TRAEFIK_STATIC_CONFIG_PATH) return null;

    return {
        domain: getInstanceHost(),
        mode: resolveInstanceTlsMode(),
        acmeEmail: process.env.ACME_EMAIL ?? '',
        certificateId: getInstanceCertificateId(),
        fallbackIp: getInstanceFallbackIp(),
    };
}
