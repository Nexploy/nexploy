import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { LOOPBACK_HOST_IP } from '@workspace/schemas-zod/docker/system/networkExposure.schema';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';

const LOOPBACK_HOST_IPS = [LOOPBACK_HOST_IP, '::1'];

export function getPortUrl(port: number) {
    const environment = useEnvironmentStore.getState().getSelectedEnvironment();

    const { hostname } = window.location;
    return `http://${environment?.host ?? hostname}:${port}`;
}

export function getDomainUrl(domain: Domain) {
    const protocol = domain.https ? 'https' : 'http';
    const path = domain.path && domain.path !== '/' ? domain.path : '';
    return `${protocol}://${domain.host}${path}`;
}

export function isLoopbackOnly(hostIps: string[]) {
    if (!hostIps.length) return false;
    return hostIps.every((hostIp) => LOOPBACK_HOST_IPS.includes(hostIp));
}
