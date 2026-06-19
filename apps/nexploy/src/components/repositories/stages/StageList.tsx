import { getTranslations } from 'next-intl/server';

import { StageCard } from '@/components/repositories/stages/StageCard';
import { DeploymentStage } from 'generated/client';

interface StageListProps {
    repositoryId: string;
    stages: DeploymentStage[];
}

export async function StageList({ repositoryId, stages }: StageListProps) {
    const t = await getTranslations('repository.stages');

    if (stages.length === 0) {
        return (
            <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
                {t('noStages')}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-muted-foreground px-1 text-sm font-medium">{t('list')}</span>
            <div className="flex flex-col gap-2">
                {stages.map((stage) => (
                    <StageCard
                        key={stage.id}
                        stage={stage}
                        stages={stages}
                        repositoryId={repositoryId}
                    />
                ))}
            </div>
        </div>
    );
}
