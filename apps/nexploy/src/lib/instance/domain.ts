import type { InstanceTlsMode } from '@workspace/schemas-zod/admin/instance.schema';
import { getInstanceCertificateId, resolveInstanceTlsMode } from './tlsMode';

export interface InstanceDomainSettings {
    domain: string;
    mode: InstanceTlsMode;
    acmeEmail: string;
    certificateId: string | null;
}

export function getInstanceDomainSettings(): InstanceDomainSettings | null {
    if (!process.env.TRAEFIK_STATIC_CONFIG_PATH) return null;

    const publicUrl = process.env.NEXPLOY_URL ?? process.env.BETTER_AUTH_URL ?? '';
    const domain = publicUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    return {
        domain,
        mode: resolveInstanceTlsMode(),
        acmeEmail: process.env.ACME_EMAIL ?? '',
        certificateId: getInstanceCertificateId(),
    };
}
