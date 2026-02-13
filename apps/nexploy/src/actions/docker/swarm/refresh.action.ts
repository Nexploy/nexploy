'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onSwarmRefreshAction = authActionServer.action(async () => {
    try {
        return await kyDocker.post(`swarm/hardRefresh`).json();
    } catch (err: unknown) {
        if (err instanceof HTTPError) {
            await setToastServer({ type: 'error', message: err.message as string });
        }
    }
});
