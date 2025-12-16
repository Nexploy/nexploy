'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { swarmLeaveSchema } from '@workspace/schemas-zod/docker/swarm/leave.schema';

export const onSwarmLeaveAction = authActionServer
    .inputSchema(swarmLeaveSchema)
    .action(async ({ parsedInput: { force } }) => {
        try {
            return await kyDocker.post(`swarm/leave`, { json: { force: !!force } }).json();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({ type: 'error', message: err.error.message as string });
            }
        }
    });
