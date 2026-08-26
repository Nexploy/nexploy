import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { hash } from 'bcryptjs';
import { LOCAL_REGISTRY_CONTAINER_PORT } from '@workspace/schemas-zod/registry/registry.schema';
import { TRAEFIK_SERVICE_DIR } from '@/lib/traefik/paths';

const BCRYPT_ROUNDS = 10;

export type LocalRegistryTraefikMeta = {
    containerName: string;
    domain: string;
    username: string;
};

type LocalRegistryConfigFile = {
    http: {
        routers: Record<string, unknown>;
        middlewares: Record<string, unknown>;
        services: Record<string, unknown>;
    };
    'x-nexploy-registry': LocalRegistryTraefikMeta & { users: string[] };
};

function toSlug(domain: string): string {
    return domain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}

function configPath(domain: string): string {
    return path.join(TRAEFIK_SERVICE_DIR, `registry-${toSlug(domain)}.yml`);
}

export async function hashRegistryPassword(username: string, password: string): Promise<string> {
    const hashed = await hash(password, BCRYPT_ROUNDS);

    return `${username}:${hashed.replace(/^\$2[ab]\$/, '$2y$')}`;
}

export async function readLocalRegistryConfig(domain: string): Promise<LocalRegistryConfigFile | null> {
    try {
        const raw = await fs.readFile(configPath(domain), 'utf8');
        const parsed = yaml.parse(raw) as LocalRegistryConfigFile | null;

        return parsed?.['x-nexploy-registry'] ? parsed : null;
    } catch {
        return null;
    }
}

export async function writeLocalRegistryTraefikConfig({
    containerName,
    domain,
    username,
    users,
}: LocalRegistryTraefikMeta & { users: string[] }): Promise<void> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });

    const key = `registry-${toSlug(domain)}`;
    const authMiddleware = `${key}-auth`;

    const config: LocalRegistryConfigFile = {
        http: {
            routers: {
                [key]: {
                    rule: `Host(\`${domain}\`)`,
                    entryPoints: ['websecure'],
                    middlewares: [authMiddleware],
                    service: key,
                    tls: { certResolver: 'letsencrypt', domains: [{ main: domain }] },
                },
            },
            middlewares: {
                [authMiddleware]: { basicAuth: { users } },
            },
            services: {
                [key]: {
                    loadBalancer: {
                        servers: [{ url: `http://${containerName}:${LOCAL_REGISTRY_CONTAINER_PORT}` }],
                    },
                },
            },
        },
        'x-nexploy-registry': { containerName, domain, username, users },
    };

    await fs.writeFile(configPath(domain), yaml.stringify(config), 'utf8');
}

export async function deleteLocalRegistryTraefikConfig(domain: string): Promise<void> {
    try {
        await fs.unlink(configPath(domain));
    } catch {}
}
