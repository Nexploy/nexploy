import { RepositoryEnv } from '@/components/repositories/tabs/envs/RepositoryEnv';
import { getAllEnvsBuildInngest } from '@/services/inngest/build.inngest.service';

interface RepositoryEnvTabProps {
    repositoryId: string;
}

export async function RepositoryEnvTab({ repositoryId }: RepositoryEnvTabProps) {
    const envVariables = await getAllEnvsBuildInngest(repositoryId);

    return <RepositoryEnv repositoryId={repositoryId} envVariables={envVariables} />;
}
