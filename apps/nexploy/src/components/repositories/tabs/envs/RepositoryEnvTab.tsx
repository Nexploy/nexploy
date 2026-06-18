import { RepositoryEnv } from '@/components/repositories/tabs/envs/RepositoryEnv';
import { getAllEnvsBuild } from '@/services/repository/build.service';

interface RepositoryEnvTabProps {
    repositoryId: string;
    stageId: string;
}

export async function RepositoryEnvTab({ repositoryId, stageId }: RepositoryEnvTabProps) {
    const envVariables = await getAllEnvsBuild(stageId);

    return (
        <RepositoryEnv repositoryId={repositoryId} stageId={stageId} envVariables={envVariables} />
    );
}
