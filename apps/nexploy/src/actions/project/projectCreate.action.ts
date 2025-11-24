'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { projectCreateFormSchema } from '@workspace/schemas-zod/project/projectCreate.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { createProjectService } from '@/services/project/createProjectService';

export const onProjectCreateAction = authActionServer
    .inputSchema(projectCreateFormSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            return await createProjectService(parsedInput, ctx);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
