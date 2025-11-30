import { addBuildJob } from '@/inngest/jobs/queue';
import { Prisma } from 'generated/client';
import { prisma } from '../../../prisma/prisma';
import { BuildConfig, BuildStatus } from '@workspace/typescript-interface/inngest/build';
import { getProjectWithEnv } from '@/services/project.service';
import { getGitProviderToken } from '@/services/git/git.service';

type ProjectWithEnv = Exclude<Prisma.PromiseReturnType<typeof getProjectWithEnv>, null>;

export async function startBuildProjectInngest(project: ProjectWithEnv, userId: string) {
    const token = await getGitProviderToken(project.gitProvider);
    if (!token) throw new Error('No access token provider found');

    const build = await createBuildInngest(project.id);

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

export async function createBuildInngest(projectId: string) {
    try {
        return await prisma.build.create({
            data: {
                projectId,
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
