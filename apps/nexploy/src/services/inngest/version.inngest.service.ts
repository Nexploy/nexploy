import { prisma } from '../../../prisma/prisma';

export async function getNextVersionNumber(
    repositoryId: string,
    environmentId: string | null,
): Promise<number> {
    const lastVersion = await prisma.version.findFirst({
        where: { repositoryId, environmentId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
    });
    return (lastVersion?.versionNumber ?? 0) + 1;
}

export interface CreateVersionInput {
    repositoryId: string;
    imageTag: string;
    versionNumber: number;
    branch: string | null;
    commitHash: string | null;
    commitMessage: string | null;
    environmentId: string | null;
    composeConfig: string | null;
}

export async function upsertVersion(input: CreateVersionInput): Promise<void> {
    await prisma.version.upsert({
        where: {
            repositoryId_imageTag: {
                repositoryId: input.repositoryId,
                imageTag: input.imageTag,
            },
        },
        update: {},
        create: input,
    });
}
