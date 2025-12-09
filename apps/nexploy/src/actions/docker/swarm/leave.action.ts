'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { swarmLeaveSchema } from '@workspace/schemas-zod/docker/swarm/leave.schema';

export const onSwarmLeaveAction = authActionServer
    .inputSchema(swarmLeaveSchema)
    .action(async ({ parsedInput: { force } }) => {
        try {
            await drinoDocker.post(`/swarm/leave`, { force: !!force }).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({ type: 'error', message: err.error.message as string });
            }
        }
    });
