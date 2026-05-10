'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { removeServicesSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';

export const onRemoveServicesAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(removeServicesSchema)
    .action(async ({ parsedInput: { serviceIds } }) => {
        try {
            return await kyDocker.delete('swarm/services', { json: { serviceIds } }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });
