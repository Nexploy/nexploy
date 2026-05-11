import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import { Hono } from 'hono';
import { networksStateManager } from '@/managers/list/networksStateManager';
import {
    networkCreateSchema,
    networkDeleteSchema,
    networkIdParamSchema,
} from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { filterNexployNetworks } from '@workspace/shared/nexployFilter';
import { deleteNetworks } from '@/services/networkService';

const app = new Hono();

app.post(
    '/hardRefresh',
    route(async () => {
        return await networksStateManager.hardRefresh();
    }),
);

app.get(
    '/',
    route(async () => {
        return filterNexployNetworks(networksStateManager.getAllNetworks());
    }),
);

app.post(
    '/create',
    route({ json: networkCreateSchema }, async (c) => {
        const { name, driver = 'bridge', options: rawOptions, labels: rawLabels, ...rest } =
            c.req.valid('json');

        const options = rawOptions.length
            ? Object.fromEntries(rawOptions.map((o) => [o.key, o.value]))
            : undefined;
        const labels = rawLabels.length
            ? Object.fromEntries(rawLabels.map((l) => [l.key, l.value]))
            : undefined;

        try {
            const info = (await docker.getNetwork(name).inspect()) as { Id: string };
            return { id: info.Id, name, alreadyExisted: true };
        } catch (err: any) {
            if (err.statusCode !== 404) throw err;
        }

        const network = await docker.createNetwork({
            Name: name,
            Driver: driver,
            ...rest,
            Options: options,
            Labels: labels,
        });
        return { id: network.id, name, alreadyExisted: false };
    }),
);

app.get(
    '/:id',
    route({ param: networkIdParamSchema }, async (c) => {
        const { id: networkId } = c.req.valid('param');
        return await docker.getNetwork(networkId).inspect();
    }),
);

app.post(
    '/delete',
    route({ json: networkDeleteSchema }, async (c) => {
        const { networkIds, force } = c.req.valid('json');
        return await deleteNetworks(networkIds, force);
    }),
);

export default app;
