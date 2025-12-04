import { getRepositorieById } from '@/services/repository.service';
import { RepositorySettings } from '@/components/repositories/tabs/settings/RepositorySettings';

interface RepositorySettingsTabProps {
    repositoryId: string;
}

export async function RepositorySettingsTab({ repositoryId }: RepositorySettingsTabProps) {
    const repository = (await getRepositorieById(repositoryId))!;

    return <RepositorySettings repository={repository} />;
}
