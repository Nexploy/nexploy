import { RepositoryEnv } from '@/components/repositories/tabs/envs/RepositoryEnv';

interface RepositoryEnvTabProps {
    repositoryId: string;
}

export function RepositoryEnvTab({ repositoryId }: RepositoryEnvTabProps) {
    return <RepositoryEnv repositoryId={repositoryId} />;
}
