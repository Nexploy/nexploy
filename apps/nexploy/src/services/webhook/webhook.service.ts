import { prisma } from '../../../prisma/prisma';
import { decrypt } from '@/lib/encryption';

export async function findRepositoryByWebhook(repositoryUrl: string): Promise<{
    id: string;
    userId: string | null;
    webhookSecret: string | null;
} | null> {
    const repository = await prisma.repository.findUnique({
        where: {
            repositoryUrl,
        },
        select: {
            id: true,
            webhookSecret: true,
            gitAccount: { select: { userId: true } },
        },
    });
    if (!repository) return null;

    return {
        id: repository.id,
        userId: repository.gitAccount?.userId ?? null,
        webhookSecret: repository.webhookSecret ? decrypt(repository.webhookSecret) : null,
    };
}
