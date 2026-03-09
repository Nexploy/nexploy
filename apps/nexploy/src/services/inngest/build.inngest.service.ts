import { prisma } from '../../../prisma/prisma';
import { BuildConfig, BuildStatus } from '@workspace/typescript-interface/inngest/build';
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
        await setToastServer({ type: 'error', message: 'Repository not found' });
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

    const pipelineConfig = await prisma.pipelineConfig.findUnique({
        where: { repositoryId: repository.id },
        select: { id: true, nodes: true, edges: true },
    });
    if (!pipelineConfig) {
        throw new Error(
            'No pipeline configuration found. Configure a pipeline before starting a build.',
        );
    }

    const build = await createBuild({
        repositoryId: repository.id,
        branch: repository.branch,
        commitHash: commit?.hash,
        commitMessage: commit?.message,
        environmentId: repository.environmentId,
        pipelineSnapshot: { nodes: pipelineConfig.nodes, edges: pipelineConfig.edges },
    });

    const imageName = `nexploy-${repository.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of repository.envVariables) {
        envVariables[env.key] = env.value;
    }

    const config: BuildConfig = {
        ...token,
        userId,
        gitAccountId: repository.gitAccountId ?? undefined,
        repositoryId: repository.id,
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitBranch: repository.branch,
        gitCommitHash: commit?.hash,
        gitCommitMessage: commit?.message,
        envVariables,
        imageName,
        imageTag: build.id,
        autoDeploy: repository.autoDeploy,
        environmentId: repository.environmentId,
    };

    await addBuildJob(build.id, config);
    return build.id;
}

export async function removeBuild(buildId: string) {
    try {
        return await prisma.build.delete({ where: { id: buildId } });
    } catch {
        throw new Error('Failed to remove build');
    }
}

export async function createBuild({
    repositoryId,
    branch,
    commitMessage,
    commitHash,
    environmentId,
    pipelineSnapshot,
}: {
    repositoryId: string;
    branch: string;
    commitMessage?: string;
    commitHash?: string;
    environmentId?: string;
    pipelineSnapshot?: object;
}) {
    try {
        return await prisma.build.create({
            data: {
                repositoryId,
                branch,
                commitMessage,
                commitHash,
                environmentId,
                pipelineSnapshot,
            },
        });
    } catch {
        throw new Error('Failed to create build');
    }
}

export async function updateStatusBuildInngest(buildId: string, status: BuildStatus) {
    try {
        return await prisma.build.update({ where: { id: buildId }, data: { status } });
    } catch {
        throw new Error('Failed to update status build');
    }
}

export async function updateNodeStatusInngest(
    buildId: string,
    nodeId: string,
    status: string,
    buildStatus?: BuildStatus,
) {
    try {
        const build = await prisma.build.findUnique({
            where: { id: buildId },
            select: { nodeStatuses: true },
        });
        const current = (build?.nodeStatuses as Record<string, string>) ?? {};
        await prisma.build.update({
            where: { id: buildId },
            data: {
                nodeStatuses: { ...current, [nodeId]: status },
                ...(buildStatus ? { status: buildStatus } : {}),
            },
        });
    } catch {
        throw new Error('Failed to update node status');
    }
}

export async function cancelBuildInngest(buildId: string) {
    const build = await prisma.build.findUnique({ where: { id: buildId } });

    if (!build) throw new Error('Build not found');
    if (build.status !== 'QUEUED' && build.status !== 'BUILDING') {
        throw new Error('Build cannot be cancelled');
    }

    await inngest.send({ name: 'build/cancel', data: { buildId } });

    return prisma.build.update({ where: { id: buildId }, data: { status: 'CANCELLED' } });
}

export async function findBuildWithEnvInngest(buildId: string) {
    try {
        const build = await prisma.build.findUnique({
            where: { id: buildId },
            include: { repository: { include: { envVariables: true } } },
        });

        if (build?.repository) {
            build.repository.envVariables = build.repository.envVariables.map((env) => ({
                ...env,
                value: decrypt(env.value),
            }));
        }

        return build;
    } catch {
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

    const config: BuildConfig = {
        ...token,
        userId,
        gitAccountId: repository.gitAccountId ?? undefined,
        repositoryId: repository.id,
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitBranch: existingBuild.branch,
        gitCommitHash: existingBuild.commitHash || undefined,
        gitCommitMessage: existingBuild.commitMessage || undefined,
        envVariables,
        imageName,
        imageTag: buildId,
        autoDeploy: repository.autoDeploy,
        environmentId,
    };

    await addBuildJob(buildId, config);
}

export async function resumeBuildRepositoryInngest(
    { buildId, environmentId }: ResumeBuildSchemaType,
    userId: string,
    existingBuild: Awaited<ReturnType<typeof findBuildWithEnvInngest>>,
) {
    if (!existingBuild || !existingBuild.repository) {
        throw new Error('Build or Repository not found');
    }
    if (existingBuild.status !== 'FAILED') {
        throw new Error('Can only resume failed builds');
    }

    await retryBuildRepositoryInngest({ buildId, environmentId }, userId, existingBuild);

    await prisma.build.update({ where: { id: buildId }, data: { status: 'QUEUED' } });
}

export async function getAllBuildsInngest(repositoryId: string) {
    try {
        return await prisma.build.findMany({
            where: { repositoryId },
            orderBy: { createdAt: 'desc' },
            include: { environment: { select: { id: true, name: true } } },
        });
    } catch {
        throw new Error('Failed to get builds');
    }
}

export async function getAllEnvsBuildInngest(repositoryId: string) {
    try {
        const envs = await prisma.envVariable.findMany({ where: { repositoryId } });
        return envs.map((env) => ({ ...env, value: decrypt(env.value) }));
    } catch {
        throw new Error('Failed to get builds');
    }
}
