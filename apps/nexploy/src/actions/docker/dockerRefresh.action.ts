'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export const onDockerRefreshAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(z.object({ environmentName: z.string().optional() }))
    .action(async ({ parsedInput: { environmentName } }) => {
    try {
        const [, t] = await Promise.all([
            Promise.all([
                kyDocker.post('containers/hardRefresh').json(),
                kyDocker.post('images/hardRefresh').json(),
                kyDocker.post('volumes/hardRefresh').json(),
                kyDocker.post('networks/hardRefresh').json(),
            ]),
            getTranslations('docker'),
        ]);
        await setToastServer({
            type: 'success',
            message: t('refreshSuccess', { name: environmentName ?? 'Docker' }),
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
