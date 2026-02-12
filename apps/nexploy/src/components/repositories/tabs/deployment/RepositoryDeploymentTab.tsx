import { getRepositorieById } from '@/services/repository.service';
import { DeploymentSettings } from './DeploymentSettings';
import { notFound } from 'next/navigation';

interface RepositoryDeploymentTabProps {
    repositoryId: string;
}

export async function RepositoryDeploymentTab({ repositoryId }: RepositoryDeploymentTabProps) {
    const repository = await getRepositorieById(repositoryId);
    if (!repository) notFound();

    return <DeploymentSettings repository={repository} />;
}
