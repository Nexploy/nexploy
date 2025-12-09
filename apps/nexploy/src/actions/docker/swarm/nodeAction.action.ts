'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { swarmNodeActionSchema } from '@workspace/schemas-zod/docker/swarm/nodeAction.schema';

export const onSwarmNodeAction = authActionServer
    .inputSchema(swarmNodeActionSchema)
    .action(async ({ parsedInput: { nodeId, action, force } }) => {
        try {
            switch (action) {
                case 'promote': {
                    await drinoDocker.post(`/swarm/nodes/${nodeId}/promote`, null).consume();
                    break;
                }
                case 'demote': {
                    await drinoDocker.post(`/swarm/nodes/${nodeId}/demote`, null).consume();
                    break;
                }
                case 'drain': {
                    await drinoDocker.post(`/swarm/nodes/${nodeId}/drain`, null).consume();
                    break;
                }
                case 'activate': {
                    await drinoDocker.post(`/swarm/nodes/${nodeId}/activate`, null).consume();
                    break;
                }
                case 'pause': {
                    await drinoDocker.post(`/swarm/nodes/${nodeId}/pause`, null).consume();
                    break;
                }
                case 'remove': {
                    await drinoDocker
                        .delete(`/swarm/nodes/${nodeId}`, { force: !!force })
                        .consume();
                    break;
                }
            }
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({ type: 'error', message: err.error.message as string });
            }
        }
    });
