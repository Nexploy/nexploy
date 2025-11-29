import { addBuildJob } from '@/inngest/jobs/queue';
import { getUserAccessTokenProvider } from '@/services/account.service';
import { Prisma } from 'generated/client';
import { prisma } from '../../../prisma/prisma';
import { BuildStatus } from '@workspace/typescript-interface/inngest/build';
import { getProjectWithEnv } from '@/services/project.service';

type ProjectWithEnv = Exclude<Prisma.PromiseReturnType<typeof getProjectWithEnv>, null>;

export async function startBuildProject(project: ProjectWithEnv) {
    const accessToken = await getUserAccessTokenProvider(project.gitProvider);
    if (!accessToken) throw new Error('No access token provider found');

    const build = await createBuild(project.id);

    const imageName = `nexploy-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const envVariables: Record<string, string> = {};
    for (const env of project.envVariables) {
        envVariables[env.key] = env.value;
    }

    const config = {
        projectId: project.id,
        projectPath: project.contextPath || '.',
        gitUrl: project.repositoryUrl,
        gitBranch: project.branch,
        gitToken: accessToken,
        envVariables,
        dockerfilePath: project.dockerfilePath || undefined,
        imageName,
        imageTag: build.id.slice(-8),
        autoDeploy: project.autoDeploy,
    };

    await addBuildJob(build.id, config);
    // await updateStatusDeployment(build.id, 'BUILDING');
}

export async function createBuild(projectId: string) {
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

export async function updateStatusBuild(buildId: string, status: BuildStatus) {
    try {
        return await prisma.build.update({
            where: { id: buildId },
            data: { status },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update status build');
    }
}
