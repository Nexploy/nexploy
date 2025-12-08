'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onDockerRefreshAction = authActionServer.action(async () => {
    try {
        await Promise.all([
            drinoDocker.post(`/containers/hardRefresh`, null).consume(),
            drinoDocker.post(`/images/hardRefresh`, null).consume(),
            drinoDocker.post(`/volumes/hardRefresh`, null).consume(),
            drinoDocker.post(`/networks/hardRefresh`, null).consume(),
        ]);
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
