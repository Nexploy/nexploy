'use server';

import { z } from 'zod';
import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { prisma } from '../../../prisma/prisma';

const domainSchema = z.object({
    repositoryId: z.string(),
    updates: z.array(
        z.object({
            id: z.string(),
            host: z.string().min(1),
            path: z.string().default('/'),
            internalPath: z.string().default('/'),
            stripPath: z.boolean().default(false),
            containerPort: z.number().int().min(1).max(65535).default(3000),
            https: z.boolean().default(false),
        }),
    ),
    creates: z.array(
        z.object({
            host: z.string().min(1),
            path: z.string().default('/'),
            internalPath: z.string().default('/'),
            stripPath: z.boolean().default(false),
            containerPort: z.number().int().min(1).max(65535).default(3000),
            https: z.boolean().default(false),
        }),
    ),
    deleteIds: z.array(z.string()),
});

export const onDomainAction = authActionServer
    .inputSchema(domainSchema)
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
                    await tx.domain.deleteMany({
                        where: {
                            id: { in: deleteIds },
                            repositoryId,
                        },
                    });
                }

                for (const update of updates) {
                    await tx.domain.update({
                        where: { id: update.id, repositoryId },
                        data: {
                            host: update.host,
                            path: update.path,
                            internalPath: update.internalPath,
                            stripPath: update.stripPath,
                            containerPort: update.containerPort,
                            https: update.https,
                        },
                    });
                }

                for (const create of creates) {
                    await tx.domain.create({
                        data: {
                            host: create.host,
                            path: create.path,
                            internalPath: create.internalPath,
                            stripPath: create.stripPath,
                            containerPort: create.containerPort,
                            https: create.https,
                            repositoryId,
                        },
                    });
                }
            });

            await setToastServer({
                type: 'success',
                message: 'Domains updated',
            });

            return { success: true };
        } catch (error) {
            await setToastServer({
                type: 'error',
                message: 'Failed to update domains',
            });
            throw error;
        }
    });
