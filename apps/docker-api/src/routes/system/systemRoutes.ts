import * as fs from 'fs/promises';
import ky from 'ky';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import { waitForContainerHealthy, waitForFile } from '@/utils/wait';
import { logger } from '@/utils/logger';
import { HttpError } from '@workspace/shared/http-error';
import { buildCachePruneSchema, type CleanupTarget, } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import { instanceDomainSchema, upgradeSchema, } from '@workspace/schemas-zod/admin/traefikFile.schema';
import type { DiskUsage } from '@workspace/typescript-interface/docker/docker.system';
import {
    DOCKER_API_CONTAINER_NAME,
    DOCKER_API_IMAGE_REPOSITORY,
    DOCKER_SOCKET_PATH,
    NEXPLOY_APP_CONTAINER_NAME,
    NEXPLOY_GITHUB_REPO,
    NEXPLOY_IMAGE_REPOSITORY,
    TRAEFIK_CONTAINER_NAME,
    TRAEFIK_STATIC_CONFIG_PATH,
} from '@/lib/config';
import { recreateContainerWithImage } from '@/utils/recreateWithImage';

const app = new Hono();

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

        const sum = <T>(arr: T[], fn: (item: T) => number) =>
            arr.reduce((acc, i) => acc + fn(i), 0);

        const imagesSize = sum(images, (i) => i.Size ?? 0);
        const imagesReclaimable = sum(images, (i) => ((i.Containers ?? 0) > 0 ? 0 : (i.Size ?? 0)));

        const containersSize = sum(containers, (c) => c.SizeRw ?? 0);
        const containersReclaimable = sum(containers, (c) =>
            c.State === 'running' ? 0 : (c.SizeRw ?? 0),
        );

        const volumesSize = sum(volumes, (v) => v.UsageData?.Size ?? 0);
        const volumesReclaimable = sum(volumes, (v) =>
            (v.UsageData?.RefCount ?? 0) > 0 ? 0 : (v.UsageData?.Size ?? 0),
        );

        const buildCacheSize = sum(buildCache, (b) => b.Size ?? 0);
        const buildCacheReclaimable = sum(buildCache, (b) => (b.InUse ? 0 : (b.Size ?? 0)));

        const totalSize = imagesSize + containersSize + volumesSize + buildCacheSize;
        const totalReclaimable =
            imagesReclaimable + containersReclaimable + volumesReclaimable + buildCacheReclaimable;

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

async function runCleanup(target: CleanupTarget): Promise<number> {
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
            const results = await Promise.all([
                pruneContainers(),
                pruneImages(),
                pruneVolumes(),
                pruneBuild(),
            ]);
            return results.reduce((acc, n) => acc + n, 0);
        }
    }
}

app.post(
    '/prune/:target',
    route(async (c) => {
        const target = c.req.param('target') as CleanupTarget;
        const reclaimedSpace = await runCleanup(target);
        return { reclaimedSpace };
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
        const { domain, useTls, acmeEmail } = c.req.valid('json');

        const appContainer = docker.getContainer(NEXPLOY_APP_CONTAINER_NAME);
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
        envMap.set('ACME_EMAIL', acmeEmail ?? '');
        const env = Array.from(envMap.entries()).map(([key, value]) => `${key}=${value}`);

        const labels = { ...(appInfo.Config.Labels ?? {}) };
        labels['traefik.http.routers.nexploy-app.rule'] = `Host(\`${domain}\`)`;
        if (useTls) {
            labels['traefik.http.routers.nexploy-app.entrypoints'] = 'websecure';
            labels['traefik.http.routers.nexploy-app.tls.certresolver'] = 'letsencrypt';
            delete labels['traefik.http.routers.nexploy-app.priority'];
        } else {
            labels['traefik.http.routers.nexploy-app.entrypoints'] = 'web';
            delete labels['traefik.http.routers.nexploy-app.tls.certresolver'];
            labels['traefik.http.routers.nexploy-app.priority'] = '1000';
        }

        await fs.rm(TRAEFIK_STATIC_CONFIG_PATH, { force: true });

        if (appInfo.State.Running) await appContainer.stop();
        await appContainer.remove();

        const newContainer = await docker.createContainer({
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
            await docker.getContainer(TRAEFIK_CONTAINER_NAME).restart();
        } catch (error) {
            logger.error({ error }, 'Failed to restart Traefik after instance domain change');
        }

        return { id: newContainer.id, publicUrl };
    }),
);

async function pullImage(image: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (pullErr: Error | null) =>
                pullErr ? reject(pullErr) : resolve(),
            );
        });
    });
}

app.get(
    '/version',
    route(async () => {
        const appInfo = await docker.getContainer(NEXPLOY_APP_CONTAINER_NAME).inspect();
        const current = appInfo.Config.Image.split(':').pop() ?? 'unknown';

        let latest = current;
        try {
            const data = await ky
                .get(`https://api.github.com/repos/${NEXPLOY_GITHUB_REPO}/releases/latest`, {
                    headers: { Accept: 'application/vnd.github+json' },
                })
                .json<{ tag_name?: string }>();
            if (data.tag_name) latest = data.tag_name.replace(/^v/, '');
        } catch (error) {
            logger.warn({ error }, 'Failed to check latest Nexploy release');
        }

        return { current, latest, updateAvailable: latest !== current };
    }),
);

app.post(
    '/upgrade',
    route({ json: upgradeSchema }, async (c) => {
        const { version } = c.req.valid('json');
        const appImage = `${NEXPLOY_IMAGE_REPOSITORY}:${version}`;
        const dockerApiImage = `${DOCKER_API_IMAGE_REPOSITORY}:${version}`;

        await pullImage(appImage);
        await pullImage(dockerApiImage);

        await recreateContainerWithImage(docker, NEXPLOY_APP_CONTAINER_NAME, appImage);

        const appReady = await waitForContainerHealthy(docker, NEXPLOY_APP_CONTAINER_NAME, 180_000);
        if (!appReady) {
            logger.warn(
                { container: NEXPLOY_APP_CONTAINER_NAME },
                'Nexploy did not report healthy in time after upgrade, restarting docker-api anyway',
            );
        }

        const helperName = 'nexploy_upgrader';
        try {
            await docker.getContainer(helperName).remove({ force: true });
        } catch {}

        const currentDockerApiInfo = await docker.getContainer(DOCKER_API_CONTAINER_NAME).inspect();
        const inheritedEnv = (currentDockerApiInfo.Config.Env ?? []).filter(
            (entry) =>
                !entry.startsWith('SELF_UPGRADE_TARGET_IMAGE=') &&
                !entry.startsWith('SELF_UPGRADE_CONTAINER_NAME=') &&
                !entry.startsWith('DOCKER_SOCKET='),
        );

        const helper = await docker.createContainer({
            name: helperName,
            Image: dockerApiImage,
            Env: [
                ...inheritedEnv,
                `SELF_UPGRADE_TARGET_IMAGE=${dockerApiImage}`,
                `SELF_UPGRADE_CONTAINER_NAME=${DOCKER_API_CONTAINER_NAME}`,
                `DOCKER_SOCKET=${DOCKER_SOCKET_PATH}`,
            ],
            HostConfig: {
                AutoRemove: true,
                Binds: [`${DOCKER_SOCKET_PATH}:${DOCKER_SOCKET_PATH}`],
            },
            NetworkingConfig: {
                EndpointsConfig: Object.fromEntries(
                    Object.keys(currentDockerApiInfo.NetworkSettings.Networks ?? {}).map((name) => [
                        name,
                        {},
                    ]),
                ),
            },
        });
        await helper.start();

        return { status: 'upgrading', version };
    }),
);

export default app;
