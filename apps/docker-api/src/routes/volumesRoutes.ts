import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { volumesStateManager } from '@/managers/volumesStateManager';
import { zValidator } from '@hono/zod-validator';
import {
    volumeCreateSchema,
    volumeDeleteSchema,
    volumeNameParamSchema,
    cacheRestoreSchema,
    cacheSaveSchema,
} from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';
import { restoreCache, saveCache } from '@/services/cacheService';

const app = new Hono();

app.get(
    '/',
    handleAsync(async () => {
        return volumesStateManager.getAllVolumes();
    }),
);

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await volumesStateManager.hardRefresh();
    }),
);

app.get(
    '/:name/inspect',
    zValidator('param', volumeNameParamSchema),
    handleAsync(async (c) => {
        const { name: volumeName } = getValidatedParam(c, volumeNameParamSchema);

        const volume = docker.getVolume(volumeName);

        return await volume.inspect();
    }),
);

app.post(
    '/create',
    zValidator('json', volumeCreateSchema),
    handleAsync(async (c) => {
        const { name, driver, driverOpts, labels } = getValidatedJson(c, volumeCreateSchema);

        const volumeExists = volumesStateManager.getState(name);
        if (volumeExists) {
            throw new Error(`Volume ${name} already exists.`);
        }

        const volume = await docker.createVolume({
            Name: name,
            Driver: driver,
            DriverOpts: driverOpts,
            Labels: labels,
        });

        return { volumeName: volume.Name };
    }),
);

app.post(
    '/delete',
    zValidator('json', volumeDeleteSchema),
    handleAsync(async (c) => {
        const { volumeNames } = getValidatedJson(c, volumeDeleteSchema);

        const force = c.req.query('force') === 'true';

        await Promise.all(
            volumeNames.map(async (volumeName: string) => {
                const volume = docker.getVolume(volumeName);
                return await volume.remove({ force });
            }),
        );

        return { deleted: volumeNames };
    }),
);

app.post(
    '/prune',
    handleAsync(async () => {
        return await docker.pruneVolumes();
    }),
);

app.post(
    '/cache/restore',
    zValidator('json', cacheRestoreSchema),
    handleAsync(async (c) => {
        const { volumeName, cachePath, workDir, cacheKey } = getValidatedJson(c, cacheRestoreSchema);
        return await restoreCache(volumeName, cachePath, workDir, cacheKey);
    }),
);

app.post(
    '/cache/save',
    zValidator('json', cacheSaveSchema),
    handleAsync(async (c) => {
        const { volumeName, sourcePath, workDir, cacheKey } = getValidatedJson(c, cacheSaveSchema);
        return await saveCache(volumeName, sourcePath, workDir, cacheKey);
    }),
);

export default app;
