import { getRepositorieById } from '@/services/repository.service';
import { ChangeBranch } from '@/components/repositories/tabs/settings/ChangeBranch';
import { ChangeBuildType } from '@/components/repositories/tabs/settings/ChangeBuildType';
import { ChangeDeployment } from '@/components/repositories/tabs/settings/ChangeDeployment';
import { DangerZone } from '@/components/repositories/tabs/settings/DangerZone';
import { notFound } from 'next/navigation';

interface RepositorySettingsTabProps {
    repositoryId: string;
}

export async function RepositorySettingsTab({ repositoryId }: RepositorySettingsTabProps) {
    const repository = await getRepositorieById(repositoryId);
    if (!repository) return notFound();

    return (
        <div className="mx-5 space-y-6">
            <ChangeBranch repository={repository} />
            <ChangeBuildType repository={repository} />
            <ChangeDeployment repository={repository} />
            <DangerZone repository={repository} />
        </div>
    );
}
