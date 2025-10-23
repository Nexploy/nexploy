'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { ComposeStackActionsSchema } from '@workspace/schemas-zod/composeStack.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onComposeStackAction = actionServer
    .inputSchema(ComposeStackActionsSchema)
    .action(async ({ parsedInput: { action, stackId } }) => {
        try {
            await drinoDocker.post(`/composeStack/${stackId}/${action}`, null).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
