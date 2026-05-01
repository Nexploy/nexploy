import { RepositoryEnv } from '@/components/repositories/tabs/envs/RepositoryEnv';
import { getAllEnvsBuild } from '@/services/repository/build.service';

interface RepositoryEnvTabProps {
    repositoryId: string;
}

export async function RepositoryEnvTab({ repositoryId }: RepositoryEnvTabProps) {
    const envVariables = await getAllEnvsBuild(repositoryId);

    return <RepositoryEnv repositoryId={repositoryId} envVariables={envVariables} />;
}
