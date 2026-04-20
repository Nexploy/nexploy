import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import {
    getContainerByProjectName,
    getContainerPortMappings,
} from '@/services/docker/container.service';
import { getEnvironmentById } from '@/services/environment/environment.service';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

export async function generateTraefikConfigForRepository(
    repositoryId: string,
    domains: Domain[],
): Promise<void> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });

    const filePath = path.join(TRAEFIK_SERVICE_DIR, `${repositoryId}.yml`);

    if (domains.length === 0) {
        await deleteTraefikConfigForRepository(repositoryId);
        return;
    }

    const projectName = `nexploy-${repositoryId}`;

    const config: {
        http: {
            routers: Record<string, unknown>;
            services: Record<string, unknown>;
            middlewares: Record<string, unknown>;
        };
        'x-nexploy-domains': Record<string, unknown>;
    } = {
        http: {
            routers: {},
            services: {},
            middlewares: {},
        },
        'x-nexploy-domains': {},
    };

    for (const domain of domains) {
        const routerName = `repo-${repositoryId}-${domain.host}`;
        const serviceName = `svc-${repositoryId}-${domain.host}`;

        const env = domain.environmentId ? await getEnvironmentById(domain.environmentId) : null;
        const isRemote = env?.connectionType === 'TCP' || env?.connectionType === 'TCP_TLS';
        const remoteHost = env?.host ?? undefined;
        const containers = await getContainerByProjectName(projectName, domain.environmentId);

        let rule = `Host(\`${domain.host}\`)`;
        if (domain.path && domain.path !== '/') {
            rule += ` && PathPrefix(\`${domain.path}\`)`;
        }

        const middlewares: string[] = [];

        if (domain.stripPath && domain.path !== '/') {
            const stripMiddlewareName = `strip-${repositoryId}-${domain.host}`;
            middlewares.push(stripMiddlewareName);

            config.http.middlewares[stripMiddlewareName] = {
                stripPrefix: {
                    prefixes: [domain.path],
                },
            };
        }

        if (
            domain.internalPath &&
            domain.internalPath !== '/' &&
            domain.internalPath !== domain.path
        ) {
            const addPrefixMiddlewareName = `addprefix-${repositoryId}-${domain.host}`;
            middlewares.push(addPrefixMiddlewareName);

            config.http.middlewares[addPrefixMiddlewareName] = {
                addPrefix: {
                    prefix: domain.internalPath,
                },
            };
        }

        const router: Record<string, unknown> = {
            rule,
            service: serviceName,
            entryPoints: domain.https ? ['websecure'] : ['web'],
        };

        if (middlewares.length > 0) {
            router.middlewares = middlewares;
        }

        if (domain.https) {
            router.tls = {
                certResolver: 'letsencrypt',
            };
        }

        config.http.routers[routerName] = router;

        const matchedContainer =
            containers.find((container) =>
                container.Ports?.some((p) => p.PrivatePort === domain.containerPort),
            ) ?? containers[0];

        const containerName = matchedContainer
            ? matchedContainer.Names[0]?.replace(/^\//, '')
            : projectName;

        if (isRemote && remoteHost) {
            let hostPort: number | undefined;
            if (matchedContainer) {
                const portMappings = await getContainerPortMappings(
                    matchedContainer.Id,
                    domain.environmentId,
                );
                hostPort = portMappings[domain.containerPort];
            }

            config.http.services[serviceName] = {
                loadBalancer: {
                    servers: [
                        {
                            url: `http://${remoteHost}:${hostPort ?? domain.containerPort}`,
                        },
                    ],
                },
            };
        } else {
            config.http.services[serviceName] = {
                loadBalancer: {
                    servers: [
                        {
                            url: `http://${containerName}:${domain.containerPort}`,
                        },
                    ],
                },
            };
        }

        config['x-nexploy-domains'][routerName] = {
            containerPort: domain.containerPort,
            environmentId: domain.environmentId,
            cloudflare: domain.cloudflareZoneId && {
                credentialId: domain.cloudflareCredentialId,
                zoneId: domain.cloudflareZoneId,
                zoneName: domain.cloudflareZoneName,
                dnsRecordId: domain.cloudflareDnsRecordId,
            },
        };
    }

    if (Object.keys(config.http.middlewares).length === 0) {
        delete (config.http as Record<string, unknown>).middlewares;
    }

    const yamlContent = yaml.stringify(config);
    await fs.writeFile(filePath, yamlContent, 'utf-8');
}

export async function deleteTraefikConfigForRepository(repositoryId: string): Promise<void> {
    const filePath = path.join(TRAEFIK_SERVICE_DIR, `${repositoryId}.yml`);

    try {
        await fs.unlink(filePath);
    } catch {
        /* empty */
    }
}

export async function getDomainsFromTraefikConfig(repositoryId: string): Promise<Domain[]> {
    const filePath = path.join(TRAEFIK_SERVICE_DIR, `${repositoryId}.yml`);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const config = yaml.parse(content);

        const routers = config?.http?.routers ?? {};
        const services = config?.http?.services ?? {};
        const middlewares = config?.http?.middlewares ?? {};
        const nexployDomains = config?.['x-nexploy-domains'] ?? {};

        return Object.entries(routers).map(([routerName, router]: [string, any]) => {
            const hostFromRouter = routerName.replace(`repo-${repositoryId}-`, '');

            const hostMatch = router.rule?.match(/Host\(`([^`]+)`\)/);
            const pathMatch = router.rule?.match(/PathPrefix\(`([^`]+)`\)/);

            const serverUrl = services[router.service]?.loadBalancer?.servers?.[0]?.url ?? '';
            const portMatch = serverUrl.match(/:(\d+)$/);

            const domainMeta = nexployDomains[routerName] ?? {};
            const cloudflare = domainMeta.cloudflare;

            const containerPort = domainMeta.containerPort
                ? Number(domainMeta.containerPort)
                : portMatch
                  ? parseInt(portMatch[1])
                  : 3000;

            return {
                id: routerName,
                host: hostMatch?.[1] ?? '',
                path: pathMatch?.[1] ?? '/',
                internalPath:
                    middlewares[`addprefix-${repositoryId}-${hostFromRouter}`]?.addPrefix?.prefix ??
                    '/',
                stripPath: !!middlewares[`strip-${repositoryId}-${hostFromRouter}`],
                containerPort,
                https: !!router.tls,
                environmentId: domainMeta.environmentId ?? undefined,
                cloudflareCredentialId: cloudflare?.credentialId,
                cloudflareZoneId: cloudflare?.zoneId,
                cloudflareZoneName: cloudflare?.zoneName,
                cloudflareDnsRecordId: cloudflare?.dnsRecordId,
            };
        });
    } catch {
        return [];
    }
}
