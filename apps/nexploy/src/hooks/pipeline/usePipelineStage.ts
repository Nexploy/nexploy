import { useQueryState } from 'nuqs';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { DeploymentStage } from '@workspace/typescript-interface/repository/deploymentStage';

export function usePipelineStage(repositoryId: string) {
    const { data, isLoading, mutate } = useSWR<DeploymentStage[]>(
        { url: `/api/repositories/${repositoryId}/stages` },
        fetcherApi,
    );

    const stages = data ?? [];

    const [stageParam, setStageParam] = useQueryState('stage', {
        shallow: false,
        history: 'push',
    });

    const fallback = stages.find((s) => s.isProduction) ?? stages[0];

    const candidate = stages.find((s) => s.id === stageParam);
    const stageId = candidate?.id ?? fallback?.id ?? null;

    const setStageId = (id: string) => {
        setStageParam(id);
    };

    return { stageId, setStageId, stages, isLoading, mutate };
}
