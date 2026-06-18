import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { DeploymentStage } from '@workspace/typescript-interface/repository/deploymentStage';

export function useStages(repositoryId: string) {
    const { data, isLoading, mutate } = useSWR<DeploymentStage[]>(
        { url: `/api/repositories/${repositoryId}/stages` },
        fetcherApi,
    );

    return { stages: data ?? [], isLoading, mutate };
}
