'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { prisma } from '../../../prisma/prisma';
import { envVariableSchema } from '@workspace/schemas-zod/repository/envVariable.schema';

export const onEnvVariableAction = authActionServer
    .inputSchema(envVariableSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { repositoryId, updates, creates, deleteIds } = parsedInput;

        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId, userId: ctx.session.user.id },
        });

        if (!repository) {
            await setToastServer({
                type: 'error',
                message: 'Repository not found',
            });
            throw new Error('Repository not found');
        }

        try {
            await prisma.$transaction(async (tx) => {
                if (deleteIds.length > 0) {
                    await tx.envVariable.deleteMany({
                        where: {
                            id: { in: deleteIds },
                            repositoryId,
                        },
                    });
                }

                for (const update of updates) {
                    await tx.envVariable.update({
                        where: { id: update.id, repositoryId },
                        data: {
                            key: update.key,
                            value: update.value,
                        },
                    });
                }

                for (const create of creates) {
                    await tx.envVariable.create({
                        data: {
                            key: create.key,
                            value: create.value,
                            repositoryId,
                        },
                    });
                }
            });

            await setToastServer({
                type: 'success',
                message: 'Environment variables updated',
            });

            return { success: true };
        } catch (error) {
            await setToastServer({
                type: 'error',
                message: 'Failed to update environment variables',
            });
            throw error;
        }
    });
