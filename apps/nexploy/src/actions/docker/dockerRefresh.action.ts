'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { getTranslations } from 'next-intl/server';

export const onDockerRefreshAction = authActionServer.action(async () => {
    try {
        await Promise.all([
            kyDocker.post('containers/hardRefresh').json(),
            kyDocker.post('images/hardRefresh').json(),
            kyDocker.post('volumes/hardRefresh').json(),
            kyDocker.post('networks/hardRefresh').json(),
        ]);
        const t = await getTranslations('docker');
        await setToastServer({
            type: 'success',
            message: t('refreshSuccess'),
        });
    } catch (err: unknown) {
        if (err instanceof HTTPError) {
            await setToastServer({
                type: 'error',
                message: err.message as string,
            });
        }
    }
});
