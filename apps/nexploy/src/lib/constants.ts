export const DEFAULT_DOCKER_SOCKET_PATH = process.env.NEXT_PUBLIC_DOCKER_SOCKET || '/var/run/docker.sock';

export const PAGE_SIZE_OPTIONS = [50, 100] as const;
export const PAGE_SIZE_DEFAULT = 50 as const;
export const BUILDS_PAGE_SIZE = 20 as const;
