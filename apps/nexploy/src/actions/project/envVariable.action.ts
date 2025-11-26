'use server';

import { z } from 'zod';
import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { prisma } from '../../../prisma/prisma';

const envVariableSchema = z.object({
    projectId: z.string(),
    updates: z.array(
        z.object({
            id: z.string(),
            key: z.string().min(1),
            value: z.string(),
        }),
    ),
    creates: z.array(
        z.object({
            key: z.string().min(1),
            value: z.string(),
        }),
    ),
    deleteIds: z.array(z.string()),
});

export const onEnvVariableAction = authActionServer
    .inputSchema(envVariableSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { projectId, updates, creates, deleteIds } = parsedInput;

        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: ctx.session.user.id },
        });

        if (!project) {
            await setToastServer({
                type: 'error',
                message: 'Project not found',
            });
            throw new Error('Project not found');
        }

        try {
            await prisma.$transaction(async (tx) => {
                if (deleteIds.length > 0) {
                    await tx.envVariable.deleteMany({
                        where: {
                            id: { in: deleteIds },
                            projectId,
                        },
                    });
                }

                for (const update of updates) {
                    await tx.envVariable.update({
                        where: { id: update.id, projectId },
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
                            projectId,
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
