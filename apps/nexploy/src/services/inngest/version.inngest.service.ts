import { prisma } from '../../../prisma/prisma';

export interface CreateVersionInput {
    repositoryId: string;
    imageTag: string;
    versionNumber: number;
    branch?: string;
    commitHash?: string;
    commitMessage?: string;
    environmentId?: string;
    composeConfig?: string;
}

export async function getNextVersionNumber(
    repositoryId: string,
    environmentId?: string,
): Promise<number> {
    const lastVersion = await prisma.version.findFirst({
        where: { repositoryId, environmentId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
    });
    return (lastVersion?.versionNumber ?? 0) + 1;
}

export async function upsertVersion(input: CreateVersionInput): Promise<void> {
    try {
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
    } catch (error: unknown) {
        throw new Error('Failed to upsert version');
    }
}
