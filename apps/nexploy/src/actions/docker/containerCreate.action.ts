'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { returnValidationErrors } from 'next-safe-action';
import { HttpErrorResponse } from 'drino';
import { ContainerCreateFormSchema } from '@workspace/schemas-zod/containerCreate.schema';

export const onContainerCreateAction = actionServer
    .inputSchema(ContainerCreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await drinoDocker.post(`/container/create`, parsedInput).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                returnValidationErrors(ContainerCreateFormSchema, {
                    _errors: [err.error.message],
                });
            }
        }
    });
