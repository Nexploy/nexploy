import { getRepositorieById } from '@/services/repository.service';
import { DeploymentSettings } from './DeploymentSettings';

interface RepositoryDeploymentTabProps {
    repositoryId: string;
}

export async function RepositoryDeploymentTab({ repositoryId }: RepositoryDeploymentTabProps) {
    const repository = (await getRepositorieById(repositoryId))!;

    return <DeploymentSettings repository={repository} />;
}
