import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';

const app = new Hono();

// Get full swarm state
app.get(
    '/',
    handleAsync(async () => {
        return {
            isSwarmActive: swarmStateManager.getIsSwarmActive(),
            swarmInfo: swarmStateManager.getSwarmInfo(),
            nodes: swarmStateManager.getAllNodes(),
            services: swarmStateManager.getAllServices(),
            tasks: swarmStateManager.getAllTasks(),
        };
    }),
);

// Get swarm info only
app.get(
    '/info',
    handleAsync(async () => {
        return {
            isSwarmActive: swarmStateManager.getIsSwarmActive(),
            swarmInfo: swarmStateManager.getSwarmInfo(),
        };
    }),
);

// Get swarm stats
app.get(
    '/stats',
    handleAsync(async () => {
        return swarmStateManager.getSwarmStats();
    }),
);

// Initialize swarm
app.post(
    '/init',
    handleAsync(async (c) => {
        const { advertiseAddr, listenAddr, forceNewCluster } = await c.req.json();

        if (!advertiseAddr) {
            return c.json({ error: 'advertiseAddr is required' }, 400);
        }

        const result = await docker.swarmInit({
            AdvertiseAddr: advertiseAddr,
            ListenAddr: listenAddr || '0.0.0.0:2377',
            ForceNewCluster: forceNewCluster || false,
        });

        await swarmStateManager.hardRefresh();

        return { success: true, nodeId: result };
    }),
);

// Join swarm
app.post(
    '/join',
    handleAsync(async (c) => {
        const { advertiseAddr, listenAddr, remoteAddrs, joinToken } = await c.req.json();

        if (!remoteAddrs || remoteAddrs.length === 0) {
            return c.json({ error: 'remoteAddrs is required' }, 400);
        }
        if (!joinToken) {
            return c.json({ error: 'joinToken is required' }, 400);
        }

        await docker.swarmJoin({
            AdvertiseAddr: advertiseAddr,
            ListenAddr: listenAddr || '0.0.0.0:2377',
            RemoteAddrs: remoteAddrs,
            JoinToken: joinToken,
        });

        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

// Leave swarm
app.post(
    '/leave',
    handleAsync(async (c) => {
        const { force } = await c.req.json().catch(() => ({ force: false }));

        await docker.swarmLeave({ force });
        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

// Get join tokens
app.get(
    '/join-tokens',
    handleAsync(async () => {
        const swarm = await docker.swarmInspect();
        return {
            worker: swarm.JoinTokens?.Worker || '',
            manager: swarm.JoinTokens?.Manager || '',
        };
    }),
);

// Rotate join tokens
app.post(
    '/rotate-tokens',
    handleAsync(async (c) => {
        const { rotateWorker, rotateManager } = await c.req.json().catch(() => ({
            rotateWorker: true,
            rotateManager: true,
        }));

        const swarm = await docker.swarmInspect();
        const spec: any = { ...swarm.Spec };

        await docker.swarmUpdate({
            version: swarm.Version.Index,
            ...spec,
            rotateWorkerToken: rotateWorker,
            rotateManagerToken: rotateManager,
        } as any);

        const updatedSwarm = await docker.swarmInspect();
        return {
            success: true,
            worker: updatedSwarm.JoinTokens?.Worker || '',
            manager: updatedSwarm.JoinTokens?.Manager || '',
        };
    }),
);

// Hard refresh
app.post(
    '/hardRefresh',
    handleAsync(async () => {
        await swarmStateManager.hardRefresh();
        return { success: true };
    }),
);

export default app;
