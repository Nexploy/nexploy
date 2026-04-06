import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { volumesStateManager } from '@/managers/volumesStateManager';
import { getTranslations } from '@/middleware/locale.middleware';
import { zValidator } from '@hono/zod-validator';
import {
    volumeCreateSchema,
    volumeDeleteSchema,
    volumeNameParamSchema,
} from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';

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
            const t = getTranslations(c, 'docker');
            throw new Error(t('errors.volumeAlreadyExists', { name }));
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

export default app;
