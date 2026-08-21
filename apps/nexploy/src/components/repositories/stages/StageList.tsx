import { getTranslations } from 'next-intl/server';

import { StageCard } from '@/components/repositories/stages/StageCard';
import { DeploymentStage } from 'generated/client';
import { EmptyState } from '@/components/shared/EmptyState';
import { Layers } from 'lucide-react';

interface StageListProps {
    repositoryId: string;
    stages: DeploymentStage[];
}

export async function StageList({ repositoryId, stages }: StageListProps) {
    const t = await getTranslations('repository.stages');

    if (stages.length === 0) {
        return <EmptyState icon={Layers} title={t('noStages')} description={t('noStagesDescription')} />;
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="px-1 font-medium text-muted-foreground text-sm">{t('list')}</span>
            <div className="flex flex-col gap-2">
                {stages.map((stage) => (
                    <StageCard key={stage.id} stage={stage} stages={stages} repositoryId={repositoryId} />
                ))}
            </div>
        </div>
    );
}
