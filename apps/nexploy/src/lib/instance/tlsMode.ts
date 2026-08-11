import { instanceTlsModes, type InstanceTlsMode } from '@workspace/schemas-zod/admin/instance.schema';

export function resolveInstanceTlsMode(): InstanceTlsMode {
    const mode = process.env.NEXPLOY_TLS_MODE;
    if (instanceTlsModes.includes(mode as InstanceTlsMode)) return mode as InstanceTlsMode;

    return process.env.TRAEFIK_USE_TLS === 'false' ? 'ip' : 'letsencrypt';
}

export function instanceTlsEnabled(): boolean {
    return resolveInstanceTlsMode() !== 'ip';
}

export function getInstanceCertificateId(): string | null {
    return process.env.NEXPLOY_TLS_CERTIFICATE_ID || null;
}
