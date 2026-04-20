import { docker } from '@/utils/dockerClient';
import { route } from '@/helpers/route';
import { Hono } from 'hono';
import { networksStateManager } from '@/managers/networksStateManager';
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
        const { name, driver = 'bridge', ...options } = c.req.valid('json');

        const networkExists = networksStateManager.getByName(name);
        if (networkExists) {
            return { id: networkExists.id, name, alreadyExisted: true };
        }

        const network = await docker.createNetwork({ Name: name, Driver: driver, ...options });
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
