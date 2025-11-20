'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { networkActionsSchema } from '@workspace/schemas-zod/network/networkAction.schema';

export const onNetworkAction = authActionServer
    .inputSchema(networkActionsSchema)
    .action(async ({ parsedInput: { action, networkIds } }) => {
        try {
            await drinoDocker.post(`/networks/${action}`, { networkIds }).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
