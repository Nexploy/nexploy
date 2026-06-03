'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';

export const onSwarmRefreshAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .action(async () => {
        try {
            return await kyDocker.post(`swarm/hardRefresh`).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
            throw err;
        }
    });
