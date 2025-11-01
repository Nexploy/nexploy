'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { z } from 'zod';

const NetworkActionsSchema = z.object({
    networkIds: z.array(z.string()),
    action: z.enum(['delete', 'prune']),
});

export const onNetworkAction = actionServer
    .inputSchema(NetworkActionsSchema)
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
