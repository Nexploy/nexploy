import { hash } from 'bcryptjs';
import { LOCAL_REGISTRY_CONTAINER_PORT } from '@workspace/schemas-zod/registry/registry.schema';

const BCRYPT_ROUNDS = 10;

type TraefikLabel = { key: string; value: string };

type LocalRegistryTraefikInput = {
    containerName: string;
    domain: string;
    username: string;
    password: string;
};

function toRouterName(containerName: string): string {
    return containerName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
}

async function toHtpasswdEntry(username: string, password: string): Promise<string> {
    const hashed = await hash(password, BCRYPT_ROUNDS);

    return `${username}:${hashed.replace(/^\$2[ab]\$/, '$2y$')}`;
}

export async function buildLocalRegistryTraefikLabels({
    containerName,
    domain,
    username,
    password,
}: LocalRegistryTraefikInput): Promise<TraefikLabel[]> {
    const router = toRouterName(containerName);
    const authMiddleware = `${router}-auth`;
    const users = await toHtpasswdEntry(username, password);

    return [
        { key: 'traefik.enable', value: 'true' },
        { key: `traefik.http.routers.${router}.rule`, value: `Host(\`${domain}\`)` },
        { key: `traefik.http.routers.${router}.entrypoints`, value: 'websecure' },
        { key: `traefik.http.routers.${router}.tls`, value: 'true' },
        { key: `traefik.http.routers.${router}.tls.certresolver`, value: 'letsencrypt' },
        { key: `traefik.http.routers.${router}.service`, value: router },
        { key: `traefik.http.routers.${router}.middlewares`, value: authMiddleware },
        { key: `traefik.http.middlewares.${authMiddleware}.basicauth.users`, value: users },
        {
            key: `traefik.http.services.${router}.loadbalancer.server.port`,
            value: String(LOCAL_REGISTRY_CONTAINER_PORT),
        },
    ];
}
