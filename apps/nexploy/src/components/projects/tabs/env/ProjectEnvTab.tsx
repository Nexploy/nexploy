import { ProjectEnv } from '@/components/projects/tabs/env/ProjectEnv';
import { getAllEnvsBuildInngest } from '@/services/inngest/build.inngest.service';

interface ProjectEnvTabProps {
    projectId: string;
}

export async function ProjectEnvTab({ projectId }: ProjectEnvTabProps) {
    const envVariables = await getAllEnvsBuildInngest(projectId);

    return <ProjectEnv projectId={projectId} envVariables={envVariables} />;
}
