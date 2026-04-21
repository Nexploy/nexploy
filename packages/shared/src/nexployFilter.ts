import { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import { Network } from '@workspace/typescript-interface/docker/docker.network';

export const BUILTIN_NETWORKS = ['bridge', 'host', 'none'] as const;

export function isBuiltinNetwork(name: string): boolean {
    return (BUILTIN_NETWORKS as readonly string[]).includes(name);
}

export const NEXPLOY_INFRASTRUCTURE_CONTAINERS = [
    'nexploy_traefik',
    'nexploy_postgres',
    'nexploy_inngest',
];

export const NEXPLOY_INFRASTRUCTURE_NETWORKS = ['nexploy_network'];

export function isNexployInfrastructureContainer(container: Containers): boolean {
    const name = container.name.replace(/^\//, '');
    return NEXPLOY_INFRASTRUCTURE_CONTAINERS.includes(name);
}

export function isNexployInfrastructureNetwork(network: Network): boolean {
    return NEXPLOY_INFRASTRUCTURE_NETWORKS.includes(network.name);
}

export function isNexployInfrastructureNetworkName(networkName: string): boolean {
    return NEXPLOY_INFRASTRUCTURE_NETWORKS.includes(networkName);
}

export function filterNexployContainers(containers: Containers[]): Containers[] {
    return containers.filter((container) => !isNexployInfrastructureContainer(container));
}

export function filterNexployNetworks(networks: Network[]): Network[] {
    return networks.filter((network) => !isNexployInfrastructureNetwork(network));
}
