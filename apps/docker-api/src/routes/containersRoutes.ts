import { route } from '@/helpers/route';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { filterNexployContainers } from '@workspace/shared/nexployFilter';
import { z } from 'zod';

const containersQuerySchema = z.object({
    name: z.string().optional(),
});

const app = new Hono();

app.get(
    '/',
    route({ query: containersQuerySchema }, async (c) => {
        const { name } = c.req.valid('query');
        const allContainers = containersStateManager.getAllStates();
        const containers = filterNexployContainers(allContainers);

        if (!name) return containers;

        return containers.filter(
            (container) =>
                container.name === name ||
                container.name === `/${name}` ||
                container.name.startsWith(`${name}-`) ||
                container.name.startsWith(`/${name}-`),
        );
    }),
);

app.post(
    '/hardRefresh',
    route(async () => {
        return await containersStateManager.hardRefresh();
    }),
);

export default app;
