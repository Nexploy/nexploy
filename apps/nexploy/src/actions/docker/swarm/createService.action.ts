'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { createServiceFormSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';

export const onCreateServiceAction = authActionServer
    .metadata({ name: 'swarm.createService' })
    .use(requirePermission('swarm', 'manage'))
    .use(requireUnprotectedEnvironment('swarm.manage'))
    .inputSchema(createServiceFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker.post('swarm/services', { json: parsedInput }).json<{ id: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
            throw err;
        }
    });
