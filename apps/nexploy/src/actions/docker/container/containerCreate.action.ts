'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { HTTPError } from 'ky';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';

export const onContainerCreateAction = authActionServer
    .inputSchema(containerCreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker
                .post(`container/create`, { json: parsedInput })
                .json<{ id: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
