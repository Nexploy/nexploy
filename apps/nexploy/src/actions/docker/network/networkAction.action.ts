'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { networkActionsSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';

export const onNetworkAction = authActionServer
    .inputSchema(networkActionsSchema)
    .action(async ({ parsedInput: { action, networkIds } }) => {
        try {
            return await kyDocker.post(`networks/${action}`, { json: networkIds }).json();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
