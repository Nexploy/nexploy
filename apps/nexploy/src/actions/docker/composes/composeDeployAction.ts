'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { deployComposeSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';

export const onComposeDeployAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(deployComposeSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker
                .post(`composes/deploy`, { json: parsedInput, timeout: false })
                .json<{ success: boolean; projectName: string; logs: string[] }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
