import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { filterNexployContainers } from '@/utils/nexployFilter';

const app = new Hono();

app.get(
    '/',
    handleAsync(async (c) => {
        const name = c.req.query('name');
        const allContainers = containersStateManager.getAllStates();
        const containers = filterNexployContainers(allContainers);

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
