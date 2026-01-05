'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { getUserEnvironments } from '@/services/environment/environment.service';

export const getUserEnvironmentsAction = authActionServer.action(async () => {
    try {
        return await getUserEnvironments();
    } catch (error: unknown) {
        if (error instanceof Error) {
            await setToastServer({
                type: 'error',
                message: error.message,
            });
        }
    }
});
