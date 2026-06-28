'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { useBuildsInfinite } from '@/hooks/useBuildsInfinite';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import type { NodeRunStatus } from '@workspace/typescript-interface/pipeline/pipeline';
import type { PipelineBuild } from '@workspace/typescript-interface/stores/pipelineStore';
import { createPipelineStore, type PipelineStore } from '@/stores/pipeline/createPipelineStore';
import { PipelineContext } from '@/contexts/PipelineContext';
import { BuildTracker } from '@/components/pipeline/buildsPanel/BuildTracker';
import { isBuildLive } from '@/utils/buildStatus';

export function PipelineProvider({
    stageId,
    initialGraph,
    initialBuilds = [],
    initialHasMore = false,
    children,
}: {
    stageId: string;
    initialGraph: PipelineGraph;
    initialBuilds?: PipelineBuild[];
    initialHasMore?: boolean;
    children: ReactNode;
}) {
    const { repositoryId } = useParams<{ repositoryId: string }>();

    const storeRef = useRef<PipelineStore>(null);
    if (!storeRef.current) {
        storeRef.current = createPipelineStore({
            repositoryId,
            stageId,
            initialGraph,
            initialBuilds,
            initialHasMore,
        });
    }
    const store = storeRef.current;

    const { builds, hasMore, isLoadingMore, loadMore } = useBuildsInfinite(
        repositoryId,
        stageId,
        initialBuilds,
        initialHasMore,
    );
    useEffect(() => {
        store.setState({
            builds,
            hasMoreBuilds: hasMore,
            isLoadingMoreBuilds: isLoadingMore,
            loadMoreBuilds: loadMore,
        });
    }, [builds, hasMore, isLoadingMore, loadMore, store]);

    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    useSWR<{
        nodeStatuses: Record<string, NodeRunStatus>;
        nodeDurations: Record<string, number>;
        nodeStartTimes: Record<string, number>;
    }>(
        activeBuildId ? { url: `/api/repositories/${repositoryId}/builds/${activeBuildId}` } : null,
        fetcherApi,
        {
            onSuccess: (data) => {
                store.getState().setBuildNodeStatuses(activeBuildId!, (prev) => ({
                    ...(data?.nodeStatuses ?? {}),
                    ...prev,
                }));
                store.getState().setBuildNodeDurations(activeBuildId!, (prev) => ({
                    ...(data?.nodeDurations ?? {}),
                    ...prev,
                }));
                store.getState().setBuildNodeStartTimes(activeBuildId!, (prev) => ({
                    ...(data?.nodeStartTimes ?? {}),
                    ...prev,
                }));
            },
        },
    );

    useEffect(() => {
        return () => setActiveBuildId(null);
    }, []);

    return (
        <PipelineContext.Provider value={store}>
            {builds.map(
                (build) =>
                    isBuildLive(build.status) && (
                        <BuildTracker
                            key={build.id}
                            buildId={build.id}
                            initialStatus={build.status}
                        />
                    ),
            )}
            {children}
        </PipelineContext.Provider>
    );
}
