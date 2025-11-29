import { addBuildJob } from '@/inngest/jobs/queue';
import { getUserAccessTokenProvider } from '@/services/account.service';
import { createBuild } from '@/services/deployment.service';
import { Prisma } from 'generated/client';
import { getProjectWithEnv } from '@/services/project/project.service';

type ProjectWithEnv = Exclude<Prisma.PromiseReturnType<typeof getProjectWithEnv>, null>;

export async function startBuildProject(project: ProjectWithEnv) {
    const accessToken = await getUserAccessTokenProvider(project.gitProvider);
    if (!accessToken) throw new Error('No access token provider found');

    const deployment = await createBuild(project.id);

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
        imageTag: deployment.id.slice(-8),
        autoDeploy: project.autoDeploy,
    };

    await addBuildJob(deployment.id, config);
    // await updateStatusDeployment(deployment.id, 'BUILDING');
}
