'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { prisma } from '@/../prisma/prisma';
import { z } from 'zod';

const disconnectSchema = z.object({
    provider: z.enum(['github', 'gitlab']),
});

export const disconnectGitAccountAction = authActionServer
    .inputSchema(disconnectSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { provider } = parsedInput;
        const userId = ctx.session.user.id;

        const gitAccount = await prisma.gitAccount.findFirst({
            where: { userId, provider },
        });

        if (!gitAccount) {
            throw new Error('Git account not found');
        }

        await prisma.gitAccount.delete({
            where: { id: gitAccount.id },
        });

        return { success: true };
    });
