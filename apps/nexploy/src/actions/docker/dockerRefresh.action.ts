'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onDockerRefreshAction = actionServer.action(async () => {
    try {
        await drinoDocker.post(`/containers/hardRefresh`, null).consume();
        await drinoDocker.post(`/images/hardRefresh`, null).consume();
        await setToastServer({
            type: 'success',
            message: 'Refresh docker success !',
        });
    } catch (err: unknown) {
        if (err instanceof HttpErrorResponse) {
            await setToastServer({
                type: 'error',
                message: err.error.message as string,
            });
        }
    }
});
