import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { LOOPBACK_HOST_IP } from '@workspace/schemas-zod/docker/system/networkExposure.schema';

const LOOPBACK_HOST_IPS = [LOOPBACK_HOST_IP, '::1'];
const WILDCARD_HOST_IPS = ['0.0.0.0', '::', ''];
const LOCAL_HOSTNAMES = ['localhost', ...LOOPBACK_HOST_IPS, ...WILDCARD_HOST_IPS];

export function getPortUrl(host: string, port: number) {
    const formattedHost = host.includes(':') ? `[${host}]` : host;
    return `http://${formattedHost}:${port}`;
}

export function getDomainUrl(domain: Pick<Domain, 'host' | 'https'> & { path?: string }) {
    const protocol = domain.https ? 'https' : 'http';
    const path = domain.path && domain.path !== '/' ? domain.path : '';
    return `${protocol}://${domain.host}${path}`;
}

export function isLoopbackOnly(hostIps: string[]) {
    if (!hostIps.length) return false;
    return hostIps.every((hostIp) => LOOPBACK_HOST_IPS.includes(hostIp));
}

export function getBoundHostIp(hostIps: string[]) {
    return hostIps.find((hostIp) => !LOOPBACK_HOST_IPS.includes(hostIp) && !WILDCARD_HOST_IPS.includes(hostIp)) ?? null;
}

export function isRoutableHost(host?: string | null) {
    if (!host) return false;
    return !LOCAL_HOSTNAMES.includes(host.trim().toLowerCase());
}
