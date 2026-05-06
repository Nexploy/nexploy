'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { z } from 'zod';

export const onScaleServiceAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(z.object({ id: z.string(), replicas: z.number().int().min(0) }))
    .action(async ({ parsedInput: { id, replicas } }) => {
        try {
            return await kyDocker
                .post(`swarm/services/${id}/scale`, { json: { replicas } })
                .json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });
