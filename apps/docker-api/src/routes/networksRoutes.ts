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
        const allNetworks = networksStateManager.getAllNetworks();
        return filterNexployNetworks(allNetworks);
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

        const network = await docker.createNetwork({
            Name: name,
            Driver: driver,
            ...options,
        });

        return {
            id: network.id,
            name,
        };
    }),
);

app.get(
    '/:id',
    zValidator('param', networkIdParamSchema),
    handleAsync(async (c) => {
        const { id: networkId } = getValidatedParam(c, networkIdParamSchema);
        const network = docker.getNetwork(networkId);

        return await network.inspect();
    }),
);

app.post(
    '/delete',
    zValidator('json', networkDeleteSchema),
    handleAsync(async (c) => {
        const { networkIds, force } = getValidatedJson(c, networkDeleteSchema);

        const BUILTIN_NETWORKS = new Set(['bridge', 'host', 'none']);

        const results = await Promise.all(
            networkIds.map(async (networkId: string) => {
                const network = docker.getNetwork(networkId);
                const info = await network.inspect();

                if (BUILTIN_NETWORKS.has(info.Name)) {
                    return { type: 'skipped', id: networkId, name: info.Name, reason: 'builtin' };
                }

                if (!force) {
                    const isComposeNetwork = !!info.Labels?.['com.docker.compose.project'];
                    if (isComposeNetwork) {
                        return {
                            type: 'skipped',
                            id: networkId,
                            name: info.Name,
                            reason: 'compose_stack',
                        };
                    }

                    const connectedContainers = Object.keys(info.Containers || {});
                    if (connectedContainers.length > 0) {
                        return {
                            type: 'skipped',
                            id: networkId,
                            name: info.Name,
                            reason: 'has_containers',
                        };
                    }
                } else {
                    const connectedContainers = Object.keys(info.Containers || {});
                    await Promise.all(
                        connectedContainers.map((containerId) =>
                            network.disconnect({ Container: containerId, Force: true }),
                        ),
                    );
                }

                await network.remove();
                return { type: 'deleted', id: networkId };
            }),
        );

        const deleted: string[] = [];
        const skipped: { id: string; name: string; reason: string }[] = [];
        for (const result of results) {
            if (result.type === 'deleted') {
                deleted.push(result.id);
            } else {
                skipped.push({ id: result.id, name: result.name!, reason: result.reason! });
            }
        }

        return { deleted, skipped };
    }),
);

export default app;
