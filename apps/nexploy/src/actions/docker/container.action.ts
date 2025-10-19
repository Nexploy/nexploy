'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { ContainerActionsSchema } from '@/schemas/actions/container.schema';
import { returnValidationErrors } from 'next-safe-action';
import { HttpErrorResponse } from 'drino';

export const onContainerAction = actionServer
    .inputSchema(ContainerActionsSchema)
    .action(async ({ parsedInput: { action, containerId } }) => {
        try {
            await drinoDocker.post(`/containers/${containerId}/${action}`, null).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                returnValidationErrors(ContainerActionsSchema, {
                    _errors: [err.error.message],
                });
            }
        }
    });
