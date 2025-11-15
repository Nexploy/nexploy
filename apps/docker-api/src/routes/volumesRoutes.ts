import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { volumesStateManager } from '@/managers/volumesStateManager';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await volumesStateManager.hardRefresh();
    }),
);

app.get(
    '/',
    handleAsync(async () => {
        return volumesStateManager.getAllVolumes();
    }),
);

app.post(
    '/create',
    handleAsync(async (c) => {
        const { name, driver, driverOpts, labels } = await c.req.json();

        const volumeExists = volumesStateManager.getState(name);
        if (volumeExists) {
            throw new Error(`Le volume ${name} existe déjà.`);
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

app.get(
    '/:name/inspect',
    handleAsync(async (c) => {
        const volumeName = c.req.param('name');
        const volume = docker.getVolume(volumeName);

        return await volume.inspect();
    }),
);

app.post(
    '/delete',
    handleAsync(async (c) => {
        const { volumeNames } = await c.req.json();

        if (!volumeNames || volumeNames.length === 0) {
            return c.json({ error: 'No volumeNames provided' }, 400);
        }

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
