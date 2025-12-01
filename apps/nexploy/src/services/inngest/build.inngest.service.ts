import { Prisma } from 'generated/client';
import { prisma } from '../../../prisma/prisma';
import { BuildConfig, BuildStatus } from '@workspace/typescript-interface/inngest/build';
import { getProjectWithEnv } from '@/services/project.service';
import { getGitProviderToken } from '@/services/git/git.service';
import { gitProviderService } from '@/services/api/gitProvider.service';
import { addBuildJob } from '@/inngest/jobs/queue';

type ProjectWithEnv = Exclude<Prisma.PromiseReturnType<typeof getProjectWithEnv>, null>;

export async function startBuildProjectInngest(project: ProjectWithEnv, userId: string) {
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
