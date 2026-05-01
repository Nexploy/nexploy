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
    try {
        const lastVersion = await prisma.version.findFirst({
            where: { repositoryId, environmentId },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
        });
        return (lastVersion?.versionNumber ?? 0) + 1;
    } catch (error: unknown) {
        throw new Error('Failed to get next version number');
    }
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

export async function deleteVersionsByImageTag(
    repositoryId: string,
    imageTag: string,
): Promise<number> {
    try {
        const result = await prisma.version.deleteMany({
            where: { repositoryId, imageTag },
        });
        return result.count;
    } catch (error: unknown) {
        throw new Error('Failed to delete versions by image tag');
    }
}
