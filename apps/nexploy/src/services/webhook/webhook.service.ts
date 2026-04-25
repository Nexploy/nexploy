import { prisma } from '../../../prisma/prisma';
import { decrypt } from '@/lib/encryption';

export async function findRepositoryByWebhook(repositoryUrl: string): Promise<{
    id: string;
    userId: string;
    webhookSecret: string | null;
} | null> {
    const repository = await prisma.repository.findUnique({
        where: {
            repositoryUrl,
        },
        select: {
            id: true,
            userId: true,
            webhookSecret: true,
        },
    });
    if (!repository) return null;

    return {
        id: repository.id,
        userId: repository.userId,
        webhookSecret: repository.webhookSecret ? decrypt(repository.webhookSecret) : null,
    };
}
