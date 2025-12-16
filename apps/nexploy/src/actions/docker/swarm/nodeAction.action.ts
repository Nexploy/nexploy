'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { swarmNodeActionSchema } from '@workspace/schemas-zod/docker/swarm/nodeAction.schema';

export const onSwarmNodeAction = authActionServer
    .inputSchema(swarmNodeActionSchema)
    .action(async ({ parsedInput: { nodeId, action, force } }) => {
        try {
            switch (action) {
                case 'promote': {
                    return await kyDocker.post(`swarm/nodes/${nodeId}/promote`).json();
                }
                case 'demote': {
                    return await kyDocker.post(`swarm/nodes/${nodeId}/demote`).json();
                }
                case 'drain': {
                    return await kyDocker.post(`swarm/nodes/${nodeId}/drain`).json();
                }
                case 'activate': {
                    return await kyDocker.post(`swarm/nodes/${nodeId}/activate`).json();
                }
                case 'pause': {
                    return await kyDocker.post(`swarm/nodes/${nodeId}/pause`).json();
                }
                case 'remove': {
                    return await kyDocker
                        .delete(`swarm/nodes/${nodeId}`, { json: { force: !!force } })
                        .json();
                }
            }
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({ type: 'error', message: err.error.message as string });
            }
        }
    });
