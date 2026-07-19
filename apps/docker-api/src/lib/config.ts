export const TRAEFIK_CONTAINER_NAME = process.env.TRAEFIK_CONTAINER_NAME ?? 'nexploy_traefik';
export const TRAEFIK_NETWORK_NAME = process.env.TRAEFIK_NETWORK_NAME ?? 'nexploy_traefik_network';
export const NEXPLOY_APP_CONTAINER_NAME = process.env.NEXPLOY_APP_CONTAINER_NAME ?? 'nexploy_app';
export const DOCKER_API_CONTAINER_NAME =
    process.env.DOCKER_API_CONTAINER_NAME ?? 'nexploy_docker_api';
export const TRAEFIK_STATIC_CONFIG_PATH =
    process.env.TRAEFIK_STATIC_CONFIG_PATH ?? '/etc/nexploy/traefik/traefik.yml';
export const DOCKER_SOCKET_PATH = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock';
export const NEXPLOY_IMAGE_REPOSITORY = process.env.NEXPLOY_IMAGE_REPOSITORY ?? 'nexploy/nexploy';
export const DOCKER_API_IMAGE_REPOSITORY =
    process.env.DOCKER_API_IMAGE_REPOSITORY ?? 'nexploy/docker-api';
export const NEXPLOY_GITHUB_REPO = process.env.NEXPLOY_GITHUB_REPO ?? 'Nexploy/nexploy';
