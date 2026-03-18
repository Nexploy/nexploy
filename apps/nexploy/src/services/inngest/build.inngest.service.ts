import { prisma } from '../../../prisma/prisma';
import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { addBuildJob } from '@/inngest/jobs/queue';
import { inngest } from '@/inngest/client';
import { getRepositorieWithEnv } from '@/services/repository.service';
import { setToastServer } from '@/lib/toastServer';
import { decrypt } from '@/lib/encryption';
import { StartBuildSchemaType } from '@workspace/schemas-zod/inngest/build.schema';
import { BuildStatus } from 'generated/client';

export async function startBuildRepositoryInngest(
    { repositoryId, commitHash }: StartBuildSchemaType,
    userId: string,
) {
    const repository = await getRepositorieWithEnv(repositoryId);

    if (!repository) {
        await setToastServer({ type: 'error', message: 'Repository not found' });
        throw new Error('Repository not found');
    }

    const pipelineConfig = await prisma.pipelineConfig.findUnique({
        where: { repositoryId: repository.id },
        select: { nodes: true, edges: true },
    });
    if (!pipelineConfig) {
        throw new Error(
            'No pipeline configuration found. Configure a pipeline before starting a build.',
        );
    }

    const build = await createBuild({
        repositoryId: repository.id,
        pipelineSnapshot: { nodes: pipelineConfig.nodes, edges: pipelineConfig.edges },
    });

    const imageName = `nexploy-${repository.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of repository.envVariables) {
        envVariables[env.key] = env.value;
    }

    const config: BuildConfig = {
        userId,
        gitAccountId: repository.gitAccountId ?? undefined,
        repositoryId: repository.id,
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        gitCommitHash: commitHash,
        envVariables,
        imageName,
        imageTag: build.id,
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
    commitMessage,
    commitHash,
    pipelineSnapshot,
}: {
    repositoryId: string;
    commitMessage?: string;
    commitHash?: string;
    pipelineSnapshot?: object;
}) {
    try {
        return await prisma.build.create({
            data: {
                repositoryId,
                commitMessage,
                commitHash,
                pipelineSnapshot,
            },
        });
    } catch {
        throw new Error('Failed to create build');
    }
}

export async function updateBuildGitInfo(
    buildId: string,
    branch: string,
    commitHash?: string,
    commitMessage?: string,
) {
    try {
        await prisma.build.update({
            where: { id: buildId },
            data: { branch, commitHash, commitMessage },
        });
    } catch {
        throw new Error('Failed to update build git info');
    }
}

export async function updateStatusBuild(buildId: string, status: BuildStatus) {
    try {
        return await prisma.build.update({ where: { id: buildId }, data: { status } });
    } catch {
        throw new Error('Failed to update status build');
    }
}

export async function updateBuildEnvironment(buildId: string, environmentId: string) {
    try {
        await prisma.build.update({ where: { id: buildId }, data: { environmentId } });
    } catch {
        throw new Error('Failed to update build environment');
    }
}

export async function updateNodeStatus(
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
