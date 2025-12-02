import { prisma } from '../../../prisma/prisma';
import { BuildConfig, BuildStatus } from '@workspace/typescript-interface/inngest/build';
import { getGitProviderToken } from '@/services/git/git.service';
import { gitProviderService } from '@/services/api/gitProvider.service';
import { addBuildJob } from '@/inngest/jobs/queue';
import { inngest } from '@/inngest/client';
import { Prisma } from 'generated/client';
import { getRepositorieWithEnv } from '@/services/repositorie.service';

export async function startBuildRepositoryInngest(
    repository: Exclude<Prisma.PromiseReturnType<typeof getRepositorieWithEnv>, null>,
    userId: string,
) {
    const token = await getGitProviderToken(repository.gitProvider);
    if (!token) throw new Error('No access token provider found');

    const lastCommit = await gitProviderService.getLatestCommit(
        repository.repositoryUrl,
        repository.branch,
        token.accessToken,
        repository.gitProvider,
    );

    const build = await createBuildInngest({
        repositoryId: repository.id,
        branch: repository.branch,
        commitHash: lastCommit?.hash,
        commitMessage: lastCommit?.message,
    });

    const imageName = `nexploy-${repository.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of repository.envVariables) {
        envVariables[env.key] = env.value;
    }

    const traefikLabels: Record<string, string> = {};
    if (repository.traefikLabels) {
        for (const label of repository.traefikLabels) {
            traefikLabels[label.key] = label.value;
        }
    }

    const primaryDomain = repository.domains?.[0];
    const traefikEnabled = !!primaryDomain;

    const config: BuildConfig = {
        ...token,
        userId,
        repositoryId: repository.id,
        repositoryPath: repository.contextPath || '.',
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitBranch: repository.branch,
        port: primaryDomain?.containerPort || 3000,
        envVariables,
        dockerfilePath: repository.dockerfilePath || undefined,
        imageName,
        imageTag: build.id.slice(-8),
        autoDeploy: repository.autoDeploy,
        traefik: {
            enabled: traefikEnabled,
            domain: primaryDomain?.host,
            labels: traefikLabels,
        },
    };

    await addBuildJob(build.id, config);
}

export async function createBuildInngest({
    repositoryId,
    branch,
    commitMessage,
    commitHash,
}: {
    repositoryId: string;
    branch: string;
    commitMessage?: string;
    commitHash?: string;
}) {
    try {
        return await prisma.build.create({
            data: {
                repositoryId,
                branch,
                commitMessage,
                commitHash,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to create build');
    }
}

export async function updateStatusBuildInngest(buildId: string, status: BuildStatus) {
    try {
        return await prisma.build.update({
            where: { id: buildId },
            data: { status },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update status build');
    }
}

export async function cancelBuildInngest(buildId: string) {
    const build = await prisma.build.findUnique({
        where: { id: buildId },
    });

    if (!build) {
        throw new Error('Build not found');
    }

    if (build.status !== 'QUEUED' && build.status !== 'BUILDING') {
        throw new Error('Build cannot be cancelled');
    }

    await inngest.send({
        name: 'build/cancel',
        data: { buildId },
    });

    return prisma.build.update({
        where: { id: buildId },
        data: { status: 'CANCELLED' },
    });
}

export async function findBuildWithEnvInngest(buildId: string) {
    try {
        return await prisma.build.findUnique({
            where: { id: buildId },
            include: {
                repository: {
                    include: {
                        envVariables: true,
                    },
                },
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to find build');
    }
}

export async function retryBuildRepositoryInngest(
    buildId: string,
    userId: string,
    existingBuild: Awaited<ReturnType<typeof findBuildWithEnvInngest>>,
) {
    if (!existingBuild || !existingBuild.repository || existingBuild.status === 'COMPLETED') {
        throw new Error('Build or Repository not found');
    }

    const repository = existingBuild.repository;

    const token = await getGitProviderToken(repository.gitProvider);
    if (!token) throw new Error('No access token provider found');

    const imageName = `nexploy-${repository.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of repository.envVariables) {
        envVariables[env.key] = env.value;
    }

    const config: BuildConfig = {
        ...token,
        userId,
        repositoryId: repository.id,
        repositoryPath: repository.contextPath || '.',
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitBranch: existingBuild.branch,
        port: 3432,
        envVariables,
        dockerfilePath: repository.dockerfilePath || undefined,
        imageName,
        imageTag: buildId.slice(-8),
        autoDeploy: repository.autoDeploy,
        traefik: {
            enabled: true,
            labels: {},
        },
    };

    await addBuildJob(buildId, config);
}

export async function getAllBuildsInngest(repositoryId: string) {
    try {
        return await prisma.build.findMany({
            where: { repositoryId },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get builds');
    }
}

export async function getAllEnvsBuildInngest(repositoryId: string) {
    try {
        return await prisma.envVariable.findMany({
            where: { repositoryId },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get builds');
    }
}
