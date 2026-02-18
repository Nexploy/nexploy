import { prisma } from '@/../prisma/prisma';
import { Version } from '@workspace/typescript-interface/docker/docker.version';

export async function getVersionsByRepository(repositoryId: string): Promise<Version[]> {
    try {
        const versions = await prisma.version.findMany({
            where: { repositoryId },
            orderBy: { createdAt: 'desc' },
        });

        return versions.map((v) => ({
            imageTag: v.imageTag,
            repositoryId: v.repositoryId,
            buildId: v.imageTag,
            commitHash: v.commitHash ?? undefined,
            commitMessage: v.commitMessage ?? undefined,
            branch: v.branch ?? undefined,
            buildType: v.buildType,
            createdAt: v.createdAt.getTime(),
            imageId: '',
            imageFullName: `${v.repositoryId}:${v.imageTag}`,
        }));
    } catch {
        return [];
    }
}
