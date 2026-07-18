export const TRAEFIK_CONTAINER_NAME = process.env.TRAEFIK_CONTAINER_NAME ?? 'nexploy_traefik';
export const TRAEFIK_NETWORK_NAME = process.env.TRAEFIK_NETWORK_NAME ?? 'nexploy_traefik_network';
export const NEXPLOY_APP_CONTAINER_NAME = process.env.NEXPLOY_APP_CONTAINER_NAME ?? 'nexploy_app';
export const TRAEFIK_STATIC_CONFIG_PATH =
    process.env.TRAEFIK_STATIC_CONFIG_PATH ?? '/etc/nexploy/traefik/traefik.yml';
