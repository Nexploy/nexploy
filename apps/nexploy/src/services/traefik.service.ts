import { prisma } from '../../prisma/prisma';

export async function getTraefikConfig(repositoryId: string) {
    const repository = await prisma.repository.findUnique({
        where: { id: repositoryId },
        select: {
            traefikLabels: true,
        },
    });

    if (!repository) {
        return null;
    }

    return {
        labels: repository.traefikLabels,
    };
}
