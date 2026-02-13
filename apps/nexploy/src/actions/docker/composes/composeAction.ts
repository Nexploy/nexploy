'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { composesActionsSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';

export const onComposesAction = authActionServer
    .inputSchema(composesActionsSchema)
    .action(async ({ parsedInput: { stackName, action } }) => {
        try {
            return await kyDocker.post(`composes/${stackName}/${action}`).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
