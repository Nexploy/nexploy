import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { safeAction } from '@/helpers/safeAction';
import { Hono } from 'hono';

const app = new Hono();

app.get(
    '/',
    handleAsync(async () => {
        const data = await docker.listVolumes();
        return data.Volumes || [];
    }),
);

app.post(
    '/create',
    handleAsync(async (c) => {
        const body = await c.req.json();
        return docker.createVolume(body);
    }),
);

app.delete(
    '/:name',
    safeAction(async (c) => {
        const volume = docker.getVolume(c.req.param('name'));
        await volume.remove();
    }),
);

export default app;
