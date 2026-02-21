import { prisma } from '../../../prisma/prisma';
import { BuildConfig, BuildStatus, BuildStep } from '@workspace/typescript-interface/inngest/build';
import { getGitProviderToken } from '@/services/git/git.service';
import { getCommit, getValidToken } from '@/services/api/gitProvider.service';
import { addBuildJob } from '@/inngest/jobs/queue';
import { inngest } from '@/inngest/client';
import { getRepositorieWithEnv } from '@/services/repository.service';
import { setToastServer } from '@/lib/toastServer';
import { decrypt } from '@/lib/encryption';
import {
    ResumeBuildSchemaType,
    RetryBuildSchemaType,
    StartBuildSchemaType,
} from '@workspace/schemas-zod/inngest/build.schema';

export async function startBuildRepositoryInngest(
    { repositoryId, commitHash }: StartBuildSchemaType,
    userId: string,
) {
    const repository = await getRepositorieWithEnv(repositoryId);

    if (!repository) {
        await setToastServer({
            type: 'error',
            message: 'Repository not found',
        });
        throw new Error('Repository not found');
    }

    const oldToken = await getGitProviderToken(repository.gitProvider, {
        gitAccountId: repository.gitAccountId ?? undefined,
        requestedUserId: userId,
    });
    const token = await getValidToken(
        oldToken,
        repository.gitProvider,
        userId,
        repository.gitAccountId ?? undefined,
    );

    const commit = await getCommit(
        repository.repositoryUrl,
        repository.branch,
        token.accessToken,
        repository.gitProvider,
        commitHash,
    );

    const activeBuild = await prisma.build.findFirst({
        where: { repositoryId: repository.id, status: { in: ['QUEUED', 'BUILDING'] } },
        select: { id: true, status: true },
    });
    if (activeBuild) {
        throw new Error(
            `A build is already in progress for this repository (build ${activeBuild.id}, status: ${activeBuild.status}). Cancel it before starting a new one.`,
        );
    }

    const build = await createBuild({
        repositoryId: repository.id,
        branch: repository.branch,
        commitHash: commit?.hash,
        commitMessage: commit?.message,
        environmentId: repository.environmentId,
    });

    const imageName = `nexploy-${repository.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of repository.envVariables) {
        envVariables[env.key] = env.value;
    }

    const buildType = repository.buildType || 'DOCKERFILE';

    const config: BuildConfig = {
        ...token,
        userId,
        gitAccountId: repository.gitAccountId ?? undefined,
        repositoryId: repository.id,
        repositoryPath: repository.contextPath || '.',
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitBranch: repository.branch,
        gitCommitHash: commit?.hash,
        gitCommitMessage: commit?.message,
        envVariables,
        buildType,
        dockerfilePath: repository.dockerfilePath || undefined,
        dockerComposePath: repository.dockerComposePath || undefined,
        imageName,
        imageTag: build.id,
        autoDeploy: repository.autoDeploy,
        environmentId: repository.environmentId,
    };

    await addBuildJob(build.id, config);
}

export async function removeBuild(buildId: string) {
    try {
        return await prisma.build.delete({
            where: { id: buildId },
        });
    } catch (error: unknown) {
        throw new Error('Failed to remove build');
    }
}

export async function createBuild({
    repositoryId,
    branch,
    commitMessage,
    commitHash,
    environmentId,
}: {
    repositoryId: string;
    branch: string;
    commitMessage?: string;
    commitHash?: string;
    environmentId?: string;
}) {
    try {
        return await prisma.build.create({
            data: {
                repositoryId,
                branch,
                commitMessage,
                commitHash,
                environmentId,
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

export async function updateLastCompletedStepInngest(buildId: string, step: BuildStep) {
    try {
        return await prisma.build.update({
            where: { id: buildId },
            data: { lastCompletedStep: step },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update last completed step');
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
        const build = await prisma.build.findUnique({
            where: { id: buildId },
            include: {
                repository: {
                    include: {
                        envVariables: true,
                    },
                },
            },
        });

        if (build && build.repository) {
            build.repository.envVariables = build.repository.envVariables.map((env) => ({
                ...env,
                value: decrypt(env.value),
            }));
        }

        return build;
    } catch (error: unknown) {
        throw new Error('Failed to find build');
    }
}

export async function retryBuildRepositoryInngest(
    { buildId, environmentId }: RetryBuildSchemaType,
    userId: string,
    existingBuild: Awaited<ReturnType<typeof findBuildWithEnvInngest>>,
) {
    if (!existingBuild || !existingBuild.repository || existingBuild.status === 'COMPLETED') {
        throw new Error('Build or Repository not found');
    }

    const repository = existingBuild.repository;

    const oldToken = await getGitProviderToken(repository.gitProvider, {
        gitAccountId: repository.gitAccountId ?? undefined,
        requestedUserId: userId,
    });
    const token = await getValidToken(
        oldToken,
        repository.gitProvider,
        userId,
        repository.gitAccountId ?? undefined,
    );

    const imageName = `nexploy-${repository.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of repository.envVariables) {
        envVariables[env.key] = env.value;
    }

    const buildType = (repository.buildType as BuildConfig['buildType']) || 'DOCKERFILE';

    const config: BuildConfig = {
        ...token,
        userId,
        gitAccountId: repository.gitAccountId ?? undefined,
        repositoryId: repository.id,
        repositoryPath: repository.contextPath || '.',
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitBranch: existingBuild.branch,
        gitCommitHash: existingBuild.commitHash || undefined,
        gitCommitMessage: existingBuild.commitMessage || undefined,
        envVariables,
        buildType,
        dockerfilePath: repository.dockerfilePath || undefined,
        dockerComposePath: repository.dockerComposePath || undefined,
        imageName,
        imageTag: buildId,
        autoDeploy: repository.autoDeploy,
        environmentId,
    };

    await addBuildJob(buildId, config);
}

export async function resumeBuildRepositoryInngest(
    { buildId, environmentId, startFromStep }: ResumeBuildSchemaType,
    userId: string,
    existingBuild: Awaited<ReturnType<typeof findBuildWithEnvInngest>>,
) {
    if (!existingBuild || !existingBuild.repository) {
        throw new Error('Build or Repository not found');
    }

    if (existingBuild.status !== 'FAILED') {
        throw new Error('Can only resume failed builds');
    }

    const repository = existingBuild.repository;

    const oldToken = await getGitProviderToken(repository.gitProvider, {
        gitAccountId: repository.gitAccountId ?? undefined,
        requestedUserId: userId,
    });
    const token = await getValidToken(
        oldToken,
        repository.gitProvider,
        userId,
        repository.gitAccountId ?? undefined,
    );

    const imageName = `nexploy-${repository.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of repository.envVariables) {
        envVariables[env.key] = env.value;
    }

    const resumeStep =
        startFromStep || getNextStep(existingBuild.lastCompletedStep as BuildStep | null);

    const buildType = (repository.buildType as BuildConfig['buildType']) || 'DOCKERFILE';

    const config: BuildConfig = {
        ...token,
        userId,
        gitAccountId: repository.gitAccountId ?? undefined,
        repositoryId: repository.id,
        repositoryPath: repository.contextPath || '.',
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitBranch: existingBuild.branch,
        gitCommitHash: existingBuild.commitHash || undefined,
        gitCommitMessage: existingBuild.commitMessage || undefined,
        envVariables,
        buildType,
        dockerfilePath: repository.dockerfilePath || undefined,
        dockerComposePath: repository.dockerComposePath || undefined,
        imageName,
        imageTag: buildId,
        autoDeploy: repository.autoDeploy,
        startFromStep: resumeStep,
        environmentId,
    };

    await prisma.build.update({
        where: { id: buildId },
        data: { status: 'QUEUED' },
    });

    await addBuildJob(buildId, config);
}

function getNextStep(lastCompletedStep: BuildStep | null): BuildStep | undefined {
    if (!lastCompletedStep) return undefined;

    const steps: BuildStep[] = [
        'clone-repository',
        'prepare-dockerfile',
        'prepare-compose',
        'write-env-file',
        'build-docker-image',
        'deploy-container',
        'deploy-compose',
        'cleanup',
        'finalize-logs',
    ];

    const currentIndex = steps.indexOf(lastCompletedStep);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) {
        return undefined;
    }

    return steps[currentIndex + 1];
}

export async function getAllBuildsInngest(repositoryId: string) {
    try {
        return await prisma.build.findMany({
            where: { repositoryId },
            orderBy: { createdAt: 'desc' },
            include: {
                environment: {
                    select: { id: true, name: true },
                },
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get builds');
    }
}

export async function getAllEnvsBuildInngest(repositoryId: string) {
    try {
        const envs = await prisma.envVariable.findMany({
            where: { repositoryId },
        });

        return envs.map((env) => ({
            ...env,
            value: decrypt(env.value),
        }));
    } catch (error: unknown) {
        throw new Error('Failed to get builds');
    }
}

export async function getCompletedBuildsInngest(repositoryId: string) {
    try {
        return await prisma.build.findMany({
            where: {
                repositoryId,
                status: 'COMPLETED',
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get completed builds');
    }
}
