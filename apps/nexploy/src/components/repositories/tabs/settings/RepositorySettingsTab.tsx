import { getRepositorieById } from '@/services/repository.service';
import { DangerZone } from '@/components/repositories/tabs/settings/DangerZone';
import { SwitchGitAccountSection } from '@/components/repositories/tabs/settings/SwitchGitAccountSection';
import { notFound } from 'next/navigation';

interface RepositorySettingsTabProps {
    repositoryId: string;
}

export async function RepositorySettingsTab({ repositoryId }: RepositorySettingsTabProps) {
    const repository = await getRepositorieById(repositoryId);
    if (!repository) return notFound();

    return (
        <div className="mx-5 space-y-6">
            <SwitchGitAccountSection
                repositoryId={repository.id}
                currentGitAccountId={repository.gitAccountId}
            />
            <DangerZone repository={repository} />
        </div>
    );
}
