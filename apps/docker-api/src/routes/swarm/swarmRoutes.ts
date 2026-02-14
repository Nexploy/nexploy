import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { getTranslations } from '@/middleware/locale.middleware';

const app = new Hono();

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

app.get(
    '/info',
    handleAsync(async () => {
        return {
            isSwarmActive: swarmStateManager.getIsSwarmActive(),
            swarmInfo: swarmStateManager.getSwarmInfo(),
        };
    }),
);

app.get(
    '/stats',
    handleAsync(async () => {
        return swarmStateManager.getSwarmStats();
    }),
);

app.post(
    '/init',
    handleAsync(async (c) => {
        const { advertiseAddr, listenAddr, forceNewCluster } = await c.req.json();

        if (!advertiseAddr) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.advertiseAddrRequired') }, 400);
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

app.post(
    '/join',
    handleAsync(async (c) => {
        const { advertiseAddr, listenAddr, remoteAddrs, joinToken } = await c.req.json();

        if (!remoteAddrs || remoteAddrs.length === 0) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.remoteAddrsRequired') }, 400);
        }
        if (!joinToken) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.joinTokenRequired') }, 400);
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

app.post(
    '/leave',
    handleAsync(async (c) => {
        const { force } = await c.req.json().catch(() => ({ force: false }));

        await docker.swarmLeave({ force });
        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

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

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        await swarmStateManager.hardRefresh();
        return { success: true };
    }),
);

export default app;
