import { docker } from '@/utils/dockerClient';
import { HttpError, route } from '@/helpers/route';
import { Hono } from 'hono';
import { volumesStateManager } from '@/managers/volumesStateManager';
import {
    cacheRestoreSchema,
    cacheSaveSchema,
    volumeCreateSchema,
    volumeDeleteQuerySchema,
    volumeDeleteSchema,
    volumeNameParamSchema,
} from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { restoreCache, saveCache } from '@/services/cacheService';
import { deleteVolumes } from '@/services/volumeService';

const app = new Hono();

app.get(
    '/',
    route(async () => {
        return volumesStateManager.getAllVolumes();
    }),
);

app.post(
    '/hardRefresh',
    route(async () => {
        return await volumesStateManager.hardRefresh();
    }),
);

app.get(
    '/:name/inspect',
    route({ param: volumeNameParamSchema }, async (c) => {
        const { name: volumeName } = c.req.valid('param');
        return await docker.getVolume(volumeName).inspect();
    }),
);

app.post(
    '/create',
    route({ json: volumeCreateSchema }, async (c) => {
        const { name, driver, driverOpts, labels } = c.req.valid('json');

        try {
            await docker.getVolume(name).inspect();
            throw new HttpError(`Volume ${name} already exists.`, 409);
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err.statusCode !== 404) throw err;
        }

        await docker.createVolume({
            Name: name,
            Driver: driver,
            DriverOpts: driverOpts,
            Labels: labels,
        });

        return { volumeName: name };
    }),
);

app.post(
    '/delete',
    route({ json: volumeDeleteSchema, query: volumeDeleteQuerySchema }, async (c) => {
        const { volumeNames } = c.req.valid('json');
        const { force } = c.req.valid('query');
        return await deleteVolumes(volumeNames, force ?? false);
    }),
);

app.post(
    '/prune',
    route(async () => {
        return await docker.pruneVolumes();
    }),
);

app.post(
    '/cache/restore',
    route({ json: cacheRestoreSchema }, async (c) => {
        const { volumeName, cachePath, workDir, cacheKey } = c.req.valid('json');
        return await restoreCache(volumeName, cachePath, workDir, cacheKey);
    }),
);

app.post(
    '/cache/save',
    route({ json: cacheSaveSchema }, async (c) => {
        const { volumeName, sourcePath, workDir, cacheKey } = c.req.valid('json');
        return await saveCache(volumeName, sourcePath, workDir, cacheKey);
    }),
);

export default app;
