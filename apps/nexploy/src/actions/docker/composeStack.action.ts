'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { returnValidationErrors } from 'next-safe-action';
import { HttpErrorResponse } from 'drino';
import { ComposeStackActionsSchema } from '@/schemas/actions/composeStack.schema';

export const onComposeStackAction = actionServer
    .inputSchema(ComposeStackActionsSchema)
    .action(async ({ parsedInput: { action, stackId } }) => {
        try {
            await drinoDocker.post(`/composeStack/${stackId}/${action}`, null).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                returnValidationErrors(ComposeStackActionsSchema, {
                    _errors: [err.error.message],
                });
            }
        }
    });
