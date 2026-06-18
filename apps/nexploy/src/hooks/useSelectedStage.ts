import { useEffect } from 'react';
import { useQueryState } from 'nuqs';
import { useStages } from '@/hooks/useStages';

/**
 * Single source of truth for the currently selected deployment stage.
 * The selection is persisted in the URL (`?stage=`) so every consumer
 * (build button, env vars tab, domains tab, …) stays in sync.
 */
export function useSelectedStage(repositoryId: string) {
    const { stages, isLoading } = useStages(repositoryId);
    const [stageParam, setStageParam] = useQueryState('stage');

    const fallback = stages.find((s) => s.isProduction) ?? stages[0];
    const isValid = !!stageParam && stages.some((s) => s.id === stageParam);
    const stageId = isValid ? stageParam : (fallback?.id ?? null);

    // Reflect the resolved stage into the URL when it is missing or stale.
    useEffect(() => {
        if (stages.length === 0 || isValid) return;
        if (fallback && stageParam !== fallback.id) {
            setStageParam(fallback.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stages, stageParam, isValid]);

    return {
        stageId,
        setStageId: (id: string) => setStageParam(id),
        stages,
        isLoading,
    };
}
