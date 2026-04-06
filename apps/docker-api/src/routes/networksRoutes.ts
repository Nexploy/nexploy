import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { networksStateManager } from '@/managers/networksStateManager';
import { getTranslations } from '@/middleware/locale.middleware';
import { zValidator } from '@hono/zod-validator';
import {
    networkCreateSchema,
    networkDeleteSchema,
    networkIdParamSchema,
} from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';
import { filterNexployNetworks } from '@workspace/shared/nexployFilter';
import { deleteNetworks } from '@/services/networkService';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await networksStateManager.hardRefresh();
    }),
);

app.get(
    '/',
    handleAsync(async () => {
        return filterNexployNetworks(networksStateManager.getAllNetworks());
    }),
);

app.post(
    '/create',
    zValidator('json', networkCreateSchema),
    handleAsync(async (c) => {
        const { name, driver = 'bridge', ...options } = getValidatedJson(c, networkCreateSchema);

        const networkExists = networksStateManager.getByName(name);
        if (networkExists) {
            const t = getTranslations(c, 'docker');
            throw new Error(t('errors.networkAlreadyExists', { name }));
        }

        const network = await docker.createNetwork({ Name: name, Driver: driver, ...options });
        return { id: network.id, name };
    }),
);

app.get(
    '/:id',
    zValidator('param', networkIdParamSchema),
    handleAsync(async (c) => {
        const { id: networkId } = getValidatedParam(c, networkIdParamSchema);
        return await docker.getNetwork(networkId).inspect();
    }),
);

app.post(
    '/delete',
    zValidator('json', networkDeleteSchema),
    handleAsync(async (c) => {
        const { networkIds, force } = getValidatedJson(c, networkDeleteSchema);
        return await deleteNetworks(networkIds, force);
    }),
);

export default app;
