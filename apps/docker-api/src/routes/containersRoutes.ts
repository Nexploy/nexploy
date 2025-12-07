import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';

const app = new Hono();

app.get(
    '/',
    handleAsync(async (c) => {
        const name = c.req.query('name');
        const containers = containersStateManager.getAllStates();

        if (!name) return containers;

        return containers.filter(
            (container) => container.name === name || container.name === `/${name}`,
        );
    }),
);

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await containersStateManager.hardRefresh();
    }),
);

export default app;
