import { logger } from '@/utils/logger';
import { TraefikOptions } from '@workspace/typescript-interface/inngest/deploy';

export interface TraefikLabelsResult {
    labels: Record<string, string>;
    networkMode: string;
}

const TRAEFIK_NETWORK = 'nexploy_dev_nexploy_network';

export function buildTraefikLabels(
    serviceName: string,
    port: number,
    options?: TraefikOptions,
): TraefikLabelsResult {
    const labels: Record<string, string> = {};

    if (!options?.enabled) {
        return { labels, networkMode: 'bridge' };
    }

    const domain = options.domain || `${serviceName}.localhost`;
    const internalPort = port;

    labels['traefik.enable'] = 'true';
    labels[`traefik.http.routers.${serviceName}.rule`] = `Host(\`${domain}\`)`;
    labels[`traefik.http.routers.${serviceName}.entrypoints`] = 'web';
    labels[`traefik.http.services.${serviceName}.loadbalancer.server.port`] = String(internalPort);

    if (options.labels) {
        Object.assign(labels, options.labels);
    }

    logger.info({ domain, serviceName, internalPort }, 'Traefik labels configured');

    return {
        labels,
        networkMode: TRAEFIK_NETWORK,
    };
}

export function sanitizeServiceName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-]/g, '-');
}
