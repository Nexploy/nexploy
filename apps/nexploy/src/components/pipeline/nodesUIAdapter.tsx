'use client';

import useSWR from 'swr';
import type { NodesUIAdapter, ResourceResult } from '@nexploy/node-ui/adapter';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useEnvironmentContainers } from '@/hooks/sse/useEnvironmentContainers';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { useEnvironmentNetworks } from '@/hooks/sse/useEnvironmentNetworks';
import { useEnvironmentVolumes } from '@/hooks/sse/useEnvironmentVolumes';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId';
import { useAncestorInputFields } from '@/hooks/useAncestorInputFields';
import { nodesHostComponents, useWebhookSetup } from '@/components/pipeline/nodesHostComponents';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { usePipelineStageId } from '@/stores/pipeline/usePipelineStore';

function useResource<T>(url: string | null): ResourceResult<T> {
    const { data, isLoading, mutate } = useSWR<T>(url ? { url } : null, fetcherApi);
    return { data, isLoading, mutate: () => void mutate() };
}

export const nodesUIAdapter: NodesUIAdapter = {
    useEnvironmentId: usePipelineEnvironmentId,
    usePanelNodeId: () => usePipelineEditorStore((s) => s.panelNodeId) ?? undefined,
    useStageId: () => usePipelineStageId() ?? undefined,
    useEnvironments: () => useEnvironmentStore((s) => s.environments),
    useSwarmServices: () => useSwarmStore((s) => s.services),
    useContainers: useEnvironmentContainers,
    useImages: useEnvironmentImages,
    useVolumes: useEnvironmentVolumes,
    useNetworks: useEnvironmentNetworks,
    useResource,
    useAncestorInputFields,
    useWebhookSetup,
    components: nodesHostComponents,
};
