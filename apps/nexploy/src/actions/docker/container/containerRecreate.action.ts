'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';

export const onContainerRecreateAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(ContainerRecreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker
                .post('container/recreate', { json: parsedInput })
                .json<{ id: string }>();
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
