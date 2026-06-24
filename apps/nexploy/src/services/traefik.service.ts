import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { getContainerPortMappings } from '@/services/docker/container.service';
import { getEnvironmentById } from '@/services/environment/environment.service';
import { prisma } from '../../prisma/prisma';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

const DOMAINS_FILE = path.join(TRAEFIK_SERVICE_DIR, 'domains.yml');

export type TraefikDomainInput = Omit<Domain, 'environmentId'> & { environmentId?: string };

export function getDomainKey(domain: { host: string }): string {
    const sanitizedHost = domain.host.replace(/\./g, '-');
    return `domain-${sanitizedHost}`;
}

export async function generateTraefikConfig(domains: TraefikDomainInput[]): Promise<void> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });

    if (domains.length === 0) {
        await deleteTraefikDomainsFile();
        return;
    }

    const certIds = domains.map((d) => d.certificateId).filter(Boolean) as string[];
    const certs = await prisma.sslCertificate.findMany({
        where: { id: { in: certIds } },
        select: { id: true, type: true, domain: true },
    });
    const certMap = new Map(
        certs.map((c) => [c.id, { type: c.type as 'LETS_ENCRYPT' | 'CUSTOM', domain: c.domain }]),
    );

    const config: {
        http: {
            routers: Record<string, unknown>;
            services: Record<string, unknown>;
            middlewares: Record<string, unknown>;
        };
        'x-nexploy-domains': Record<string, unknown>;
    } = {
        http: { routers: {}, services: {}, middlewares: {} },
        'x-nexploy-domains': {},
    };

    for (const domain of domains) {
        const containerName = domain.containerName;
        if (!containerName) {
            console.warn(
                `[traefik] Domain "${domain.host}" has no target container; skipping. ` +
                    `Select a container for this domain so Traefik knows where to route it.`,
            );
            continue;
        }

        const key = getDomainKey(domain);
        const routerName = key;
        const serviceName = key.replace(/^domain-/, 'svc-');

        const env = domain.environmentId ? await getEnvironmentById(domain.environmentId) : null;
        const isRemote = env?.connectionType === 'TCP' || env?.connectionType === 'TCP_TLS';
        const remoteHost = env?.host ?? undefined;

        let rule = `Host(\`${domain.host}\`)`;
        if (domain.path && domain.path !== '/') {
            rule += ` && PathPrefix(\`${domain.path}\`)`;
        }
        const middlewares: string[] = ['maintenance-errors@file'];

        if (domain.stripPath && domain.path !== '/') {
            const stripMiddlewareName = key.replace(/^domain-/, 'strip-');
            middlewares.push(stripMiddlewareName);
            config.http.middlewares[stripMiddlewareName] = {
                stripPrefix: { prefixes: [domain.path] },
            };
        }

        if (
            domain.internalPath &&
            domain.internalPath !== '/' &&
            domain.internalPath !== domain.path
        ) {
            const addPrefixMiddlewareName = key.replace(/^domain-/, 'addprefix-');
            middlewares.push(addPrefixMiddlewareName);
            config.http.middlewares[addPrefixMiddlewareName] = {
                addPrefix: { prefix: domain.internalPath },
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
            const cert = domain.certificateId ? certMap.get(domain.certificateId) : null;
            if (cert?.type === 'LETS_ENCRYPT') {
                router.tls = {
                    certResolver: 'letsencrypt',
                    domains: [{ main: domain.host }],
                };
            } else {
                router.tls = {};
            }
        }

        config.http.routers[routerName] = router;

        if (isRemote && remoteHost) {
            const portMappings = await getContainerPortMappings(
                containerName,
                domain.environmentId,
            );
            const hostPort = portMappings[domain.containerPort];

            if (hostPort === undefined) {
                console.warn(
                    `[traefik] Remote domain "${domain.host}" has no published host port for container port ${domain.containerPort} on ${remoteHost}. ` +
                        `Traefik will not be able to reach the container. Ensure the container publishes port ${domain.containerPort} and that ${remoteHost} is reachable from the Traefik host.`,
                );
            }

            config.http.services[serviceName] = {
                loadBalancer: {
                    servers: [{ url: `http://${remoteHost}:${hostPort ?? domain.containerPort}` }],
                },
            };
        } else {
            config.http.services[serviceName] = {
                loadBalancer: {
                    servers: [{ url: `http://${containerName}:${domain.containerPort}` }],
                },
            };
        }

        config['x-nexploy-domains'][routerName] = {
            containerName,
            containerPort: domain.containerPort,
            environmentId: domain.environmentId,
            certificateId: domain.certificateId,
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

    if (Object.keys(config.http.routers).length === 0) {
        await deleteTraefikDomainsFile();
        return;
    }

    await fs.writeFile(DOMAINS_FILE, yaml.stringify(config), 'utf-8');
}

export async function deleteTraefikDomainsFile(): Promise<void> {
    try {
        await fs.unlink(DOMAINS_FILE);
    } catch {
        /* empty */
    }
}

export async function getDomains(): Promise<Domain[]> {
    try {
        const content = await fs.readFile(DOMAINS_FILE, 'utf-8');
        const config = yaml.parse(content);

        const routers = config?.http?.routers ?? {};
        const services = config?.http?.services ?? {};
        const middlewares = config?.http?.middlewares ?? {};
        const nexployDomains = config?.['x-nexploy-domains'] ?? {};

        return Object.entries(routers).map(([routerName, router]: [string, any]) => {
            const stripName = routerName.replace(/^domain-/, 'strip-');
            const addPrefixName = routerName.replace(/^domain-/, 'addprefix-');

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
                internalPath: middlewares[addPrefixName]?.addPrefix?.prefix ?? '/',
                stripPath: !!middlewares[stripName],
                containerName: domainMeta.containerName,
                containerPort,
                https: !!router.tls,
                certificateId: domainMeta.certificateId,
                environmentId: domainMeta.environmentId,
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
