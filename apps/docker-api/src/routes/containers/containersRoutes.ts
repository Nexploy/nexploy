import { route } from '@/utils/route';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/list/containersStateManager';
import { filterNexployContainers } from '@nexploy/shared/nexployFilter';
import { filterVisibleContainers } from '@/lib/containerOwnership';
import { docker } from '@/utils/dockerClient';
import { containerPruneSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { runTrackedTask } from '@/lib/taskRunner';
import { containersQuerySchema } from '@workspace/schemas-zod/docker/container/containerQuery.schema';

const app = new Hono();

app.get(
    '/',
    route({ query: containersQuerySchema }, async (c) => {
        const { name } = c.req.valid('query');
        const allContainers = containersStateManager.getAllStates();
        const containers = await filterVisibleContainers(filterNexployContainers(allContainers));

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

app.post(
    '/prune',
    route({ json: containerPruneSchema }, async (c) => {
        const { olderThan, filter } = c.req.valid('json');

        const filters: Record<string, string[]> = {};
        if (olderThan) filters.until = [olderThan];
        if (filter) filters.label = [filter];

        return runTrackedTask({
            kind: 'container-prune',
            subjectName: '',
            run: async () => {
                const result = (await docker.pruneContainers({
                    filters: JSON.stringify(filters),
                })) as { ContainersDeleted?: string[] | null; SpaceReclaimed?: number };

                return {
                    removedContainers: result.ContainersDeleted?.length ?? 0,
                    reclaimedSpace: result.SpaceReclaimed ?? 0,
                };
            },
        });
    }),
);

export default app;
