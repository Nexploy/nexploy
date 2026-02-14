import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { networksStateManager } from '@/managers/networksStateManager';
import { filterNexployNetworks } from '@workspace/shared/nexployFilter';
import { getTranslations } from '@/middleware/locale.middleware';

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
    handleAsync(async (c) => {
        const { name, driver = 'bridge', ...options } = await c.req.json();

        if (!name) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.networkNameRequired') }, 400);
        }

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

app.post(
    '/:id/connect',
    handleAsync(async (c) => {
        const { containerId } = await c.req.json();
        const networkId = c.req.param('id');

        if (!containerId) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.containerIdRequired') }, 400);
        }

        const network = docker.getNetwork(networkId);
        await network.connect({ Container: containerId });

        return {
            networkId,
            containerId,
            connected: true,
        };
    }),
);

app.post(
    '/:id/disconnect',
    handleAsync(async (c) => {
        const { containerId, force = false } = await c.req.json();
        const networkId = c.req.param('id');

        if (!containerId) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.containerIdRequired') }, 400);
        }

        const network = docker.getNetwork(networkId);
        await network.disconnect({
            Container: containerId,
            Force: force,
        });

        return {
            networkId,
            containerId,
            disconnected: true,
        };
    }),
);

app.get(
    '/:id',
    handleAsync(async (c) => {
        const networkId = c.req.param('id');
        const network = docker.getNetwork(networkId);

        return await network.inspect();
    }),
);

app.post(
    '/delete',
    handleAsync(async (c) => {
        const { networkIds, force = false } = await c.req.json();

        if (!networkIds || networkIds.length === 0) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.noNetworkIdsProvided') }, 400);
        }

        const BUILTIN_NETWORKS = ['bridge', 'host', 'none'];
        const deleted: string[] = [];
        const skipped: { id: string; name: string; reason: string }[] = [];

        for (const networkId of networkIds) {
            const network = docker.getNetwork(networkId);
            const info = await network.inspect();

            if (BUILTIN_NETWORKS.includes(info.Name)) {
                skipped.push({ id: networkId, name: info.Name, reason: 'builtin' });
                continue;
            }

            if (!force) {
                const isComposeNetwork = !!info.Labels?.['com.docker.compose.project'];
                if (isComposeNetwork) {
                    skipped.push({ id: networkId, name: info.Name, reason: 'compose_stack' });
                    continue;
                }

                const connectedContainers = Object.keys(info.Containers || {});
                if (connectedContainers.length > 0) {
                    skipped.push({ id: networkId, name: info.Name, reason: 'has_containers' });
                    continue;
                }
            } else {
                const connectedContainers = Object.keys(info.Containers || {});
                for (const containerId of connectedContainers) {
                    await network.disconnect({ Container: containerId, Force: true });
                }
            }

            await network.remove();
            deleted.push(networkId);
        }

        return { deleted, skipped };
    }),
);

export default app;
