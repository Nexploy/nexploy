'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { initActionSchema } from '@workspace/schemas-zod/docker/swarm/init.schema';

export const onInitSwarmAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(initActionSchema)
    .action(async ({ parsedInput: { advertiseAddr, listenAddr, forceNewCluster } }) => {
        try {
            return await kyDocker
                .post(`swarm/init`, {
                    json: {
                        ...(advertiseAddr ? { advertiseAddr } : {}),
                        listenAddr,
                        forceNewCluster,
                    },
                })
                .json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
