'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { z } from 'zod';

export const onRemoveServiceAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput: { id } }) => {
        try {
            return await kyDocker.delete(`swarm/services/${id}`).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });
