'use client';

import { useTranslations } from 'next-intl';

import { usePipelineStage } from '@/hooks/pipeline/usePipelineStage.ts';
import { StageCard } from '@/components/repositories/stages/StageCard';

interface StageListProps {
    repositoryId: string;
}

export function StageList({ repositoryId }: StageListProps) {
    const t = useTranslations('repository.stages');
    const { stages } = usePipelineStage(repositoryId);

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
                    <StageCard key={stage.id} stage={stage} repositoryId={repositoryId} />
                ))}
            </div>
        </div>
    );
}
