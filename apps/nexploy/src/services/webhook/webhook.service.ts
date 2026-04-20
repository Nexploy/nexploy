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
            gitAccount: {
                select: {
                    gitProvider: {
                        select: { webhookSecret: true },
                    },
                },
            },
        },
    });
    if (!repository) return null;

    const encryptedSecret = repository.gitAccount?.gitProvider?.webhookSecret ?? null;

    return {
        id: repository.id,
        userId: repository.userId,
        webhookSecret: encryptedSecret ? decrypt(encryptedSecret) : null,
    };
}
