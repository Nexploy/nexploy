import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import {
    buildCachePruneSchema,
    type CleanupTarget,
} from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import type { DiskUsage } from '@workspace/typescript-interface/docker/docker.system';

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

export default app;
