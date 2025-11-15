import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { networksStateManager } from '@/managers/networksStateManager';

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
        return networksStateManager.getAllNetworks();
    }),
);

app.post(
    '/create',
    handleAsync(async (c) => {
        const { name, driver = 'bridge', ...options } = await c.req.json();

        if (!name) {
            return c.json({ error: 'Network name is required' }, 400);
        }

        const networkExists = networksStateManager.getByName(name);
        if (networkExists) throw new Error(`Le réseau ${name} existe déjà.`);

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
            return c.json({ error: 'Container ID is required' }, 400);
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
            return c.json({ error: 'Container ID is required' }, 400);
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
        const { networkIds } = await c.req.json();

        if (!networkIds || networkIds.length === 0) {
            return c.json({ error: 'No networkIds provided' }, 400);
        }

        await Promise.all(
            networkIds.map(async (networkId: string) => {
                const network = docker.getNetwork(networkId);
                return await network.remove();
            }),
        );

        return { deleted: networkIds };
    }),
);

export default app;
