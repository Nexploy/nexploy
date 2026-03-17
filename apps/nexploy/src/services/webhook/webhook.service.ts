import { prisma } from '../../../prisma/prisma';

export async function findRepositoryByWebhook(repositoryUrl: string): Promise<{
    id: string;
    userId: string;
} | null> {
    const repository = await prisma.repository.findUnique({
        where: {
            repositoryUrl,
        },
        select: {
            id: true,
            userId: true,
        },
    });
    if (!repository) return null;

    return {
        id: repository.id,
        userId: repository.userId,
    };
}
