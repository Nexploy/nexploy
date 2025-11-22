'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { projectCreateFormSchema } from '@workspace/schemas-zod/project/projectCreate.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { prisma } from '../../../prisma/prisma';

export const onProjectCreateAction = authActionServer
    .inputSchema(projectCreateFormSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const project = await prisma.project.create({
                data: {
                    ...parsedInput,
                    userId: ctx.session.user.id,
                },
            });

            return project.id;
        } catch (err: unknown) {
            await setToastServer({
                type: 'error',
                message: 'Une erreur est survenue lors de la création du projet',
            });
            console.error(err);
            throw err;
        }
    });
