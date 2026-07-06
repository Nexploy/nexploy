export const BUILTIN_NETWORKS = ['bridge', 'host', 'none'];
export function isBuiltinNetwork(name) {
    return BUILTIN_NETWORKS.includes(name);
}
export const NEXPLOY_INFRASTRUCTURE_CONTAINERS = [
    'nexploy_traefik',
    'nexploy_postgres',
    'nexploy_inngest',
];
export const NEXPLOY_INFRASTRUCTURE_NETWORKS = ['nexploy_network'];
export function isNexployInfrastructureContainer(container) {
    const name = container.name.replace(/^\//, '');
    return NEXPLOY_INFRASTRUCTURE_CONTAINERS.includes(name);
}
export function isNexployInfrastructureNetwork(network) {
    return NEXPLOY_INFRASTRUCTURE_NETWORKS.includes(network.name);
}
export function isNexployInfrastructureNetworkName(networkName) {
    return NEXPLOY_INFRASTRUCTURE_NETWORKS.includes(networkName);
}
export function filterNexployContainers(containers) {
    return containers.filter((container) => !isNexployInfrastructureContainer(container));
}
export function filterNexployNetworks(networks) {
    return networks.filter((network) => !isNexployInfrastructureNetwork(network));
}
