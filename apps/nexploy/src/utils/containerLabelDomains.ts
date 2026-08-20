import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';

export type PortDomain = Pick<Domain, 'host' | 'path' | 'https'> & { id?: string; containerPort?: number };

const ROUTER_RULE_PATTERN = /^traefik\.http\.routers\.([^.]+)\.rule$/;
const HOST_PATTERN = /Host\(`([^`]+)`\)/g;
const PATH_PREFIX_PATTERN = /PathPrefix\(`([^`]+)`\)/;

function getServicePort(labels: Record<string, string>, routerName: string) {
    const serviceName = labels[`traefik.http.routers.${routerName}.service`] ?? routerName;
    const rawPort = labels[`traefik.http.services.${serviceName}.loadbalancer.server.port`];
    const port = rawPort ? Number(rawPort) : Number.NaN;

    return Number.isFinite(port) ? port : undefined;
}

export function getLabelDomains(labels?: Record<string, string> | null): PortDomain[] {
    if (!labels) return [];

    const domains: PortDomain[] = [];

    for (const [key, value] of Object.entries(labels)) {
        const routerName = key.match(ROUTER_RULE_PATTERN)?.[1];
        if (!routerName || !value) continue;

        const path = value.match(PATH_PREFIX_PATTERN)?.[1] ?? '/';
        const https =
            labels[`traefik.http.routers.${routerName}.tls`] === 'true' ||
            labels[`traefik.http.routers.${routerName}.entrypoints`] === 'websecure';
        const containerPort = getServicePort(labels, routerName);

        for (const match of value.matchAll(HOST_PATTERN)) {
            const host = match[1];
            if (!host) continue;

            domains.push({ id: `label-${routerName}-${host}`, host, path, https, containerPort });
        }
    }

    return domains;
}

export function mergePortDomains(...groups: PortDomain[][]): PortDomain[] {
    const merged = new Map<string, PortDomain>();

    for (const domain of groups.flat()) {
        const key = `${domain.host}${domain.path ?? '/'}`;
        if (!merged.has(key)) merged.set(key, domain);
    }

    return Array.from(merged.values());
}
