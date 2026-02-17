'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { prisma } from '@/../prisma/prisma';
import { z } from 'zod';

const disconnectSchema = z.object({
    gitProviderId: z.string(),
});

export const disconnectGitAccountAction = authActionServer
    .inputSchema(disconnectSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { gitProviderId } = parsedInput;
        const userId = ctx.session.user.id;

        const gitAccount = await prisma.gitAccount.findUnique({
            where: {
                userId_gitProviderId: { userId, gitProviderId },
            },
        });

        if (!gitAccount) {
            throw new Error('Git account not found');
        }

        await prisma.gitAccount.delete({
            where: { id: gitAccount.id },
        });

        return { success: true };
    });
