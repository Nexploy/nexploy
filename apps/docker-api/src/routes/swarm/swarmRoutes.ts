import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { getTranslations } from '@/middleware/locale.middleware';
import { HttpError } from '@workspace/shared/http-error';
import { zValidator } from '@hono/zod-validator';
import { initActionSchema } from '@workspace/schemas-zod/docker/swarm/init.schema';
import { swarmJoinSchema } from '@workspace/schemas-zod/docker/swarm/join.schema';
import { swarmLeaveSchema } from '@workspace/schemas-zod/docker/swarm/leave.schema';
import { getValidatedJson } from '@/helpers/validation';

const app = new Hono();

app.post(
    '/init',
    zValidator('json', initActionSchema),
    handleAsync(async (c) => {
        const { advertiseAddr, listenAddr, forceNewCluster } = getValidatedJson(
            c,
            initActionSchema,
        );

        const result = await docker.swarmInit({
            AdvertiseAddr: advertiseAddr,
            ListenAddr: listenAddr || '0.0.0.0:2377',
            ForceNewCluster: forceNewCluster,
        });

        await swarmStateManager.hardRefresh();

        return { success: true, nodeId: result };
    }),
);

app.post(
    '/join',
    zValidator('json', swarmJoinSchema),
    handleAsync(async (c) => {
        const { advertiseAddr, listenAddr, remoteAddrs, joinToken } = getValidatedJson(
            c,
            swarmJoinSchema,
        );

        if (!remoteAddrs || remoteAddrs.length === 0) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.remoteAddrsRequired'), 400);
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
    zValidator('json', swarmLeaveSchema),
    handleAsync(async (c) => {
        const { force } = getValidatedJson(c, swarmLeaveSchema);

        await docker.swarmLeave({ force });
        await swarmStateManager.hardRefresh();

        return { success: true };
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
