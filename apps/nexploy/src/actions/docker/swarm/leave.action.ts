'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { swarmLeaveSchema } from '@workspace/schemas-zod/docker/swarm/leave.schema';

export const onSwarmLeaveAction = authActionServer
    .metadata({ name: 'swarm.leave' })
    .use(requirePermission('swarm', 'manage'))
    .use(requireUnprotectedEnvironment('swarm.manage'))
    .inputSchema(swarmLeaveSchema)
    .action(async ({ parsedInput: { force } }) => {
        try {
            return await kyDocker.post(`swarm/leave`, { json: { force } }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
            throw err;
        }
    });
