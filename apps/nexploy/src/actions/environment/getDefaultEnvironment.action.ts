'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { getDefaultEnvironment } from '@/services/environment/environment.service';

export const getDefaultEnvironmentAction = authActionServer
    .use(requirePermission('environment', 'read'))
    .action(async () => {
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
