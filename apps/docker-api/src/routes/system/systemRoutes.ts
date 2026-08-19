import * as fs from 'fs/promises';
import ky from 'ky';
import { Hono } from 'hono';
import { defaultDocker, docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import { waitForFile } from '@/utils/wait';
import { logger } from '@/utils/logger';
import { HttpError } from '@nexploy/shared/http-error';
import { buildCachePruneSchema, type CleanupTarget } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import { instanceDomainSchema, upgradeSchema } from '@workspace/schemas-zod/admin/instance.schema';
import type { DiskUsage, DockerEngineVersion } from '@workspace/typescript-interface/docker/docker.system';
import type { DiskGuardStatus } from '@workspace/typescript-interface/docker/docker.disk';
import { readHostDiskUsage, resolveDiskGuardLevel } from '@/lib/diskSpace';
import { getDiskGuardSettings } from '@/lib/diskGuardSettings';
import {
    DOCKER_API_CONTAINER_NAME,
    DOCKER_API_IMAGE_REPOSITORY,
    DOCKER_SOCKET_PATH,
    NEXPLOY_APP_CONTAINER_NAME,
    NEXPLOY_GITHUB_REPO,
    NEXPLOY_IMAGE_REPOSITORY,
    TRAEFIK_CONTAINER_NAME,
    TRAEFIK_STATIC_CONFIG_PATH,
    UPGRADER_CONTAINER_NAME,
} from '@/lib/config';
import { pullImage } from '@/utils/pullImage';
import { runTrackedTask, type TrackedTaskContext } from '@/lib/taskRunner';
import type { TaskKind } from '@workspace/typescript-interface/task';

const app = new Hono();

const IP_FALLBACK_ROUTER = 'traefik.http.routers.nexploy-app-ip';

interface DfImage {
    Size?: number;
    Containers?: number;
}
interface DfContainer {
    SizeRw?: number;
    State?: string;
}
interface DfVolume {
    UsageData?: { Size?: number; RefCount?: number };
}
interface DfBuildCache {
    Size?: number;
    InUse?: boolean;
}
interface BuildCachePruneResult {
    CachesDeleted?: string[];
    SpaceReclaimed?: number;
}

app.get(
    '/df',
    route(async (): Promise<DiskUsage> => {
        const df = (await docker.df()) as {
            LayersSize?: number;
            Images?: DfImage[];
            Containers?: DfContainer[];
            Volumes?: DfVolume[];
            BuildCache?: DfBuildCache[];
        };

        const images = df.Images ?? [];
        const containers = df.Containers ?? [];
        const volumes = df.Volumes ?? [];
        const buildCache = df.BuildCache ?? [];

        const sum = <T>(arr: T[], fn: (item: T) => number) => arr.reduce((acc, i) => acc + fn(i), 0);

        const imagesSize = sum(images, (i) => i.Size ?? 0);
        const imagesReclaimable = sum(images, (i) => ((i.Containers ?? 0) > 0 ? 0 : (i.Size ?? 0)));

        const containersSize = sum(containers, (c) => c.SizeRw ?? 0);
        const containersReclaimable = sum(containers, (c) => (c.State === 'running' ? 0 : (c.SizeRw ?? 0)));

        const volumesSize = sum(volumes, (v) => v.UsageData?.Size ?? 0);
        const volumesReclaimable = sum(volumes, (v) =>
            (v.UsageData?.RefCount ?? 0) > 0 ? 0 : (v.UsageData?.Size ?? 0),
        );

        const buildCacheSize = sum(buildCache, (b) => b.Size ?? 0);
        const buildCacheReclaimable = sum(buildCache, (b) => (b.InUse ? 0 : (b.Size ?? 0)));

        const totalSize = imagesSize + containersSize + volumesSize + buildCacheSize;
        const totalReclaimable = imagesReclaimable + containersReclaimable + volumesReclaimable + buildCacheReclaimable;

        return {
            layersSize: df.LayersSize ?? 0,
            images: {
                total: images.length,
                active: images.filter((i) => (i.Containers ?? 0) > 0).length,
                size: imagesSize,
                reclaimable: imagesReclaimable,
            },
            containers: {
                total: containers.length,
                running: containers.filter((c) => c.State === 'running').length,
                size: containersSize,
                reclaimable: containersReclaimable,
            },
            volumes: {
                total: volumes.length,
                active: volumes.filter((v) => (v.UsageData?.RefCount ?? 0) > 0).length,
                size: volumesSize,
                reclaimable: volumesReclaimable,
            },
            buildCache: {
                total: buildCache.length,
                size: buildCacheSize,
                reclaimable: buildCacheReclaimable,
            },
            totalSize,
            totalReclaimable,
        };
    }),
);

app.get(
    '/disk',
    route(async (): Promise<DiskGuardStatus> => {
        const [usage, settings] = await Promise.all([readHostDiskUsage(), getDiskGuardSettings()]);

        return { ...usage, level: resolveDiskGuardLevel(usage, settings), settings };
    }),
);

app.get(
    '/docker-version',
    route(async (): Promise<DockerEngineVersion> => {
        const version = await docker.version();

        return {
            version: version.Version ?? 'unknown',
            apiVersion: version.ApiVersion ?? 'unknown',
            minApiVersion: version.MinAPIVersion ?? null,
            gitCommit: version.GitCommit ?? null,
            goVersion: version.GoVersion ?? null,
            os: version.Os ?? null,
            arch: version.Arch ?? null,
            kernelVersion: version.KernelVersion ?? null,
            buildTime: version.BuildTime ? new Date(version.BuildTime).toISOString() : null,
            platformName: version.Platform?.Name ?? null,
        };
    }),
);

async function pruneImages(): Promise<number> {
    const result = await docker.pruneImages({ filters: JSON.stringify({ dangling: ['false'] }) });
    return result.SpaceReclaimed ?? 0;
}

async function pruneVolumes(): Promise<number> {
    const result = await docker.pruneVolumes();
    return (result as { SpaceReclaimed?: number }).SpaceReclaimed ?? 0;
}

async function pruneContainers(): Promise<number> {
    const result = await docker.pruneContainers();
    return (result as { SpaceReclaimed?: number }).SpaceReclaimed ?? 0;
}

async function pruneBuild(): Promise<number> {
    const result = (await docker.pruneBuilder()) as { SpaceReclaimed?: number };
    return result.SpaceReclaimed ?? 0;
}

const CLEANUP_TASK_KINDS: Record<CleanupTarget, TaskKind> = {
    containers: 'system-prune-containers',
    images: 'system-prune-images',
    volumes: 'system-prune-volumes',
    build: 'system-prune-build',
    all: 'system-prune-all',
};

async function runCleanup(target: CleanupTarget, context: TrackedTaskContext): Promise<number> {
    switch (target) {
        case 'images':
            return pruneImages();
        case 'volumes':
            return pruneVolumes();
        case 'containers':
            return pruneContainers();
        case 'build':
            return pruneBuild();
        case 'all': {
            const steps = [pruneContainers, pruneImages, pruneVolumes, pruneBuild];

            let reclaimed = 0;
            for (const [index, step] of steps.entries()) {
                reclaimed += await step();
                context.setProgress(((index + 1) / steps.length) * 100);
            }
            return reclaimed;
        }
    }
}

app.post(
    '/prune/:target',
    route(async (c) => {
        const target = c.req.param('target') as CleanupTarget;
        const kind = CLEANUP_TASK_KINDS[target];

        if (!kind) throw new HttpError(`Unknown cleanup target '${target}'`, 400);

        return runTrackedTask({
            kind,
            subjectName: '',
            run: async (context) => {
                const reclaimedSpace = await runCleanup(target, context);
                return { reclaimedSpace };
            },
        });
    }),
);

function parseFilters(filter?: string): Record<string, string[]> {
    if (!filter) return {};

    const filters: Record<string, string[]> = {};
    for (const entry of filter.split(',')) {
        const [key, ...rest] = entry.split('=');
        const name = key?.trim();
        const value = rest.join('=').trim();
        if (!name || !value) continue;
        filters[name] = [...(filters[name] ?? []), value];
    }
    return filters;
}

app.post(
    '/build-cache/prune',
    route({ json: buildCachePruneSchema }, async (c) => {
        const { all, keepStorage, filter } = c.req.valid('json');

        const query = new URLSearchParams();
        if (all) query.set('all', 'true');
        if (keepStorage !== undefined) query.set('keep-storage', String(keepStorage));

        const filters = parseFilters(filter);
        if (Object.keys(filters).length > 0) query.set('filters', JSON.stringify(filters));

        const queryString = query.toString();

        const result = await new Promise<BuildCachePruneResult>((resolve, reject) => {
            docker.modem.dial(
                {
                    path: `/build/prune${queryString ? `?${queryString}` : ''}`,
                    method: 'POST',
                    statusCodes: { 200: true, 500: 'server error' },
                },
                (err: Error | null, data: unknown) => {
                    if (err) return reject(err);
                    resolve((data ?? {}) as BuildCachePruneResult);
                },
            );
        });

        return {
            deletedCaches: result.CachesDeleted?.length ?? 0,
            reclaimedSpace: result.SpaceReclaimed ?? 0,
        };
    }),
);

app.post(
    '/instance-domain',
    route({ json: instanceDomainSchema }, async (c) => {
        const { domain, mode, acmeEmail, certificateId, fallbackIp } = c.req.valid('json');
        const useTls = mode !== 'ip';

        const appContainer = defaultDocker.getContainer(NEXPLOY_APP_CONTAINER_NAME);
        let appInfo;
        try {
            appInfo = await appContainer.inspect();
        } catch {
            throw new HttpError(`Container '${NEXPLOY_APP_CONTAINER_NAME}' not found`, 404);
        }

        const publicUrl = `${useTls ? 'https' : 'http'}://${domain}`;

        const envMap = new Map(
            (appInfo.Config.Env ?? []).map((entry) => {
                const idx = entry.indexOf('=');
                return [entry.slice(0, idx), entry.slice(idx + 1)] as [string, string];
            }),
        );
        envMap.set('BETTER_AUTH_URL', publicUrl);
        envMap.set('NEXPLOY_URL', publicUrl);
        envMap.set('TRAEFIK_USE_TLS', String(useTls));
        envMap.set('NEXPLOY_TLS_MODE', mode);
        envMap.set('ACME_EMAIL', acmeEmail ?? '');
        if (mode === 'custom' && certificateId) {
            envMap.set('NEXPLOY_TLS_CERTIFICATE_ID', certificateId);
        } else {
            envMap.delete('NEXPLOY_TLS_CERTIFICATE_ID');
        }
        if (useTls && fallbackIp) {
            envMap.set('NEXPLOY_FALLBACK_IP', fallbackIp);
        } else {
            envMap.delete('NEXPLOY_FALLBACK_IP');
        }
        const env = Array.from(envMap.entries()).map(([key, value]) => `${key}=${value}`);

        const securityHeadersMiddleware = useTls ? 'security-headers@file' : 'security-headers-no-hsts@file';

        const labels = { ...(appInfo.Config.Labels ?? {}) };
        labels['traefik.http.routers.nexploy-app.rule'] = `Host(\`${domain}\`)`;
        labels['traefik.http.routers.nexploy-app.middlewares'] = `gzip-compress@file,${securityHeadersMiddleware}`;
        labels['traefik.http.routers.nexploy-app.service'] = 'nexploy-app';
        if (mode === 'letsencrypt') {
            labels['traefik.http.routers.nexploy-app.entrypoints'] = 'websecure';
            labels['traefik.http.routers.nexploy-app.tls'] = 'true';
            labels['traefik.http.routers.nexploy-app.tls.certresolver'] = 'letsencrypt';
            delete labels['traefik.http.routers.nexploy-app.priority'];
        } else if (mode === 'custom') {
            labels['traefik.http.routers.nexploy-app.entrypoints'] = 'websecure';
            labels['traefik.http.routers.nexploy-app.tls'] = 'true';
            delete labels['traefik.http.routers.nexploy-app.tls.certresolver'];
            delete labels['traefik.http.routers.nexploy-app.priority'];
        } else {
            labels['traefik.http.routers.nexploy-app.entrypoints'] = 'web';
            delete labels['traefik.http.routers.nexploy-app.tls'];
            delete labels['traefik.http.routers.nexploy-app.tls.certresolver'];
            labels['traefik.http.routers.nexploy-app.priority'] = '1000';
        }

        for (const key of Object.keys(labels)) {
            if (key.startsWith(`${IP_FALLBACK_ROUTER}.`)) delete labels[key];
        }

        if (useTls && fallbackIp) {
            labels[`${IP_FALLBACK_ROUTER}.rule`] = `Host(\`${fallbackIp}\`)`;
            labels[`${IP_FALLBACK_ROUTER}.entrypoints`] = 'web';
            labels[`${IP_FALLBACK_ROUTER}.priority`] = '1000';
            labels[`${IP_FALLBACK_ROUTER}.middlewares`] = 'gzip-compress@file,security-headers-no-hsts@file';
            labels[`${IP_FALLBACK_ROUTER}.service`] = 'nexploy-app';
        }

        await fs.rm(TRAEFIK_STATIC_CONFIG_PATH, { force: true });

        if (appInfo.State.Running) await appContainer.stop();
        await appContainer.remove();

        const newContainer = await defaultDocker.createContainer({
            name: appInfo.Name.replace('/', ''),
            Image: appInfo.Config.Image,
            Hostname: appInfo.Config.Hostname,
            Env: env,
            Cmd: appInfo.Config.Cmd,
            Entrypoint: appInfo.Config.Entrypoint,
            Volumes: appInfo.Config.Volumes,
            WorkingDir: appInfo.Config.WorkingDir,
            User: appInfo.Config.User,
            Labels: labels,
            ExposedPorts: appInfo.Config.ExposedPorts,
            HostConfig: appInfo.HostConfig,
            NetworkingConfig: {
                EndpointsConfig: Object.fromEntries(
                    Object.keys(appInfo.NetworkSettings.Networks ?? {}).map((name) => [name, {}]),
                ),
            },
        });

        await newContainer.start();

        const configReady = await waitForFile(TRAEFIK_STATIC_CONFIG_PATH, 60_000);
        if (!configReady) {
            logger.warn(
                { path: TRAEFIK_STATIC_CONFIG_PATH },
                'Traefik static config was not regenerated in time after instance domain change',
            );
        }

        try {
            await defaultDocker.getContainer(TRAEFIK_CONTAINER_NAME).restart();
        } catch (error) {
            logger.error({ error }, 'Failed to restart Traefik after instance domain change');
        }

        return { id: newContainer.id, publicUrl };
    }),
);

function buildReleaseUrl(tag: string): string {
    return `https://github.com/${NEXPLOY_GITHUB_REPO}/releases/tag/${tag}`;
}

app.get(
    '/version',
    route(async () => {
        let current = 'unknown';
        try {
            const appInfo = await defaultDocker.getContainer(NEXPLOY_APP_CONTAINER_NAME).inspect();
            current = appInfo.Config.Image.split(':').pop() ?? 'unknown';
        } catch (error) {
            logger.warn(
                { error, container: NEXPLOY_APP_CONTAINER_NAME },
                'Failed to inspect the Nexploy app container while resolving the current version',
            );
        }

        let latest = current;
        let releaseUrl: string | null = null;
        try {
            const data = await ky
                .get(`https://api.github.com/repos/${NEXPLOY_GITHUB_REPO}/releases/latest`, {
                    headers: { Accept: 'application/vnd.github+json' },
                })
                .json<{ tag_name?: string; html_url?: string }>();
            if (data.tag_name) {
                latest = data.tag_name.replace(/^v/, '');
                releaseUrl = data.html_url ?? buildReleaseUrl(data.tag_name);
            }
        } catch (error) {
            logger.warn({ error }, 'Failed to check latest Nexploy release');
        }

        return {
            current,
            latest,
            updateAvailable: current !== 'unknown' && latest !== current,
            releaseUrl,
            releasesUrl: `https://github.com/${NEXPLOY_GITHUB_REPO}/releases`,
        };
    }),
);

app.post(
    '/upgrade',
    route({ json: upgradeSchema }, async (c) => {
        const { version } = c.req.valid('json');
        const appImage = `${NEXPLOY_IMAGE_REPOSITORY}:${version}`;
        const dockerApiImage = `${DOCKER_API_IMAGE_REPOSITORY}:${version}`;

        await pullImage(defaultDocker, dockerApiImage);

        try {
            await defaultDocker.getContainer(UPGRADER_CONTAINER_NAME).remove({ force: true });
        } catch {}

        const currentDockerApiInfo = await defaultDocker.getContainer(DOCKER_API_CONTAINER_NAME).inspect();
        const inheritedEnv = (currentDockerApiInfo.Config.Env ?? []).filter(
            (entry) => !entry.startsWith('SELF_UPGRADE_') && !entry.startsWith('DOCKER_SOCKET='),
        );

        const upgrader = await defaultDocker.createContainer({
            name: UPGRADER_CONTAINER_NAME,
            Image: dockerApiImage,
            Env: [
                ...inheritedEnv,
                `SELF_UPGRADE_TARGET_IMAGE=${dockerApiImage}`,
                `SELF_UPGRADE_CONTAINER_NAME=${DOCKER_API_CONTAINER_NAME}`,
                `SELF_UPGRADE_APP_TARGET_IMAGE=${appImage}`,
                `SELF_UPGRADE_APP_CONTAINER_NAME=${NEXPLOY_APP_CONTAINER_NAME}`,
                `DOCKER_SOCKET=${DOCKER_SOCKET_PATH}`,
            ],
            HostConfig: {
                AutoRemove: false,
                Binds: [`${DOCKER_SOCKET_PATH}:${DOCKER_SOCKET_PATH}`],
            },
            NetworkingConfig: {
                EndpointsConfig: Object.fromEntries(
                    Object.keys(currentDockerApiInfo.NetworkSettings.Networks ?? {}).map((name) => [name, {}]),
                ),
            },
        });

        logger.info({ appImage, dockerApiImage }, 'Handing the upgrade over to the upgrader container');
        await upgrader.start();

        return { status: 'upgrading', version };
    }),
);

export default app;
