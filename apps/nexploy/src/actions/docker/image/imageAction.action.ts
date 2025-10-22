'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { returnValidationErrors } from 'next-safe-action';
import { HttpErrorResponse } from 'drino';
import { ImageActionsSchema } from '@workspace/schemas-zod/image/imageAction.schema';

export const onImageAction = actionServer
    .inputSchema(ImageActionsSchema)
    .action(async ({ parsedInput: { action, imageId } }) => {
        try {
            await drinoDocker.delete(`/images/${imageId}/${action}`).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                returnValidationErrors(ImageActionsSchema, {
                    _errors: [err.error.message],
                });
            }
        }
    });
