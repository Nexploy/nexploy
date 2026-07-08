'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { serviceIdParamSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';

export const onForceUpdateServiceAction = authActionServer
    .use(requirePermission('swarm', 'manage'))
    .inputSchema(serviceIdParamSchema)
    .action(async ({ parsedInput: { id } }) => {
        try {
            return await kyDocker.post(`swarm/services/${id}/force-update`).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
            throw err;
        }
    });
