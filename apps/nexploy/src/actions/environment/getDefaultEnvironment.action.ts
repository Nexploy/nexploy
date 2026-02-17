'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { getDefaultEnvironment } from '@/services/environment/environment.service';

export const getDefaultEnvironmentAction = authActionServer.action(async () => {
    try {
        return await getDefaultEnvironment();
    } catch (error: unknown) {
        if (error instanceof Error) {
            await setToastServer({
                type: 'error',
                message: error.message,
            });
        }
    }
});
