import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import { swarmStateManager } from '@/managers/list/swarmStateManager';
import { HttpError } from '@workspace/shared/http-error';
import { initActionSchema } from '@workspace/schemas-zod/docker/swarm/init.schema';
import { swarmJoinSchema } from '@workspace/schemas-zod/docker/swarm/join.schema';
import { swarmLeaveSchema } from '@workspace/schemas-zod/docker/swarm/leave.schema';

const app = new Hono();

app.post(
    '/init',
    route({ json: initActionSchema }, async (c) => {
        const { advertiseAddr, listenAddr, forceNewCluster } = c.req.valid('json');

        const result = await docker.swarmInit({
            AdvertiseAddr: advertiseAddr,
            ListenAddr: listenAddr,
            ForceNewCluster: forceNewCluster,
        });

        await swarmStateManager.hardRefresh();

        return { success: true, nodeId: result };
    }),
);

app.post(
    '/join',
    route({ json: swarmJoinSchema }, async (c) => {
        const { advertiseAddr, listenAddr, remoteAddrs, joinToken } = c.req.valid('json');

        if (!remoteAddrs || remoteAddrs.length === 0) {
            throw new HttpError('Remote addresses are required.', 400);
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
    route({ json: swarmLeaveSchema }, async (c) => {
        const { force } = c.req.valid('json');

        await docker.swarmLeave({ force });
        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

app.post(
    '/hardRefresh',
    route(async () => {
        await swarmStateManager.hardRefresh();
        return { success: true };
    }),
);

export default app;
