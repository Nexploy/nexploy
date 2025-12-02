import { prisma } from '../../../prisma/prisma';
import { BuildConfig, BuildStatus } from '@workspace/typescript-interface/inngest/build';
import { getProjectWithEnv } from '@/services/project.service';
import { getGitProviderToken } from '@/services/git/git.service';
import { gitProviderService } from '@/services/api/gitProvider.service';
import { addBuildJob } from '@/inngest/jobs/queue';
import { inngest } from '@/inngest/client';
import { Prisma } from 'generated/client';

export async function startBuildProjectInngest(
    project: Exclude<Prisma.PromiseReturnType<typeof getProjectWithEnv>, null>,
    userId: string,
) {
    const token = await getGitProviderToken(project.gitProvider);
    if (!token) throw new Error('No access token provider found');

    const lastCommit = await gitProviderService.getLatestCommit(
        project.repositoryUrl,
        project.branch,
        token.accessToken,
        project.gitProvider,
    );

    const build = await createBuildInngest({
        projectId: project.id,
        branch: project.branch,
        commitHash: lastCommit?.hash,
        commitMessage: lastCommit?.message,
    });

    const imageName = `nexploy-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of project.envVariables) {
        envVariables[env.key] = env.value;
    }

    const config: BuildConfig = {
        ...token,
        userId,
        projectId: project.id,
        projectPath: project.contextPath || '.',
        gitProvider: project.gitProvider,
        gitUrl: project.repositoryUrl,
        gitBranch: project.branch,
        port: 3432,
        envVariables,
        dockerfilePath: project.dockerfilePath || undefined,
        imageName,
        imageTag: build.id.slice(-8),
        autoDeploy: project.autoDeploy,
    };

    await addBuildJob(build.id, config);
}

export async function createBuildInngest({
    projectId,
    branch,
    commitMessage,
    commitHash,
}: {
    projectId: string;
    branch: string;
    commitMessage?: string;
    commitHash?: string;
}) {
    try {
        return await prisma.build.create({
            data: {
                projectId,
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
                project: {
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

export async function retryBuildProjectInngest(
    buildId: string,
    userId: string,
    existingBuild: Awaited<ReturnType<typeof findBuildWithEnvInngest>>,
) {
    if (!existingBuild || !existingBuild.project || existingBuild.status === 'COMPLETED') {
        throw new Error('Build or project not found');
    }

    const project = existingBuild.project;

    const token = await getGitProviderToken(project.gitProvider);
    if (!token) throw new Error('No access token provider found');

    const imageName = `nexploy-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of project.envVariables) {
        envVariables[env.key] = env.value;
    }

    const config: BuildConfig = {
        ...token,
        userId,
        projectId: project.id,
        projectPath: project.contextPath || '.',
        gitProvider: project.gitProvider,
        gitUrl: project.repositoryUrl,
        gitBranch: existingBuild.branch,
        port: 3432,
        envVariables,
        dockerfilePath: project.dockerfilePath || undefined,
        imageName,
        imageTag: buildId.slice(-8),
        autoDeploy: project.autoDeploy,
    };

    await addBuildJob(buildId, config);
}

export async function getAllBuildsInngest(projectId: string) {
    try {
        return await prisma.build.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get builds');
    }
}

export async function getAllEnvsBuildInngest(projectId: string) {
    try {
        return await prisma.envVariable.findMany({
            where: { projectId },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get builds');
    }
}
