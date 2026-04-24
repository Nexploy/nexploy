'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { z } from 'zod';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

const relinkGitAccountSchema = z.object({
    gitAccountId: z.string().min(1),
});

export const relinkGitAccountAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(relinkGitAccountSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            await prisma.repository.update({
                where: { id: repositoryId },
                data: { gitAccountId: parsedInput.gitAccountId },
            });

            revalidatePath('/[locale]/(app)/repositories/[repositoryId]', 'page');
        } catch {
            await setToastServer({ type: 'error', message: 'Failed to relink Git account' });
            throw new Error('Failed to relink Git account');
        }
    });
