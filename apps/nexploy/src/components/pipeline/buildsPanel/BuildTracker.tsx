'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { usePipelineStoreInstance } from '@/contexts/PipelineContext';
import { isBuildLive } from '@/utils/buildStatus';
import { type CommitInfo, type NodeRunStatus } from '@/types/pipeline.type';
import type { PipelineBuildStatus } from '@workspace/typescript-interface/stores/pipelineStore';

export function BuildTracker({
    buildId,
    initialStatus,
}: {
    buildId: string;
    initialStatus: PipelineBuildStatus;
}) {
    const store = usePipelineStoreInstance();
    const patchBuildOverlay = useStore(store, (s) => s.patchBuildOverlay);
    const setBuildNodeStatuses = useStore(store, (s) => s.setBuildNodeStatuses);

    const status = useStore(store, (s) => s.buildOverlays[buildId]?.status ?? initialStatus);
    const isLive = isBuildLive(status);

    const processedCountRef = useRef(0);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId,
            topics: ['build-status', 'commit-info', 'node-status'],
        });
        return result?.data ?? null;
    }, [buildId]);

    const { data: liveEvents } = useInngestSubscription({ enabled: isLive, refreshToken });

    useEffect(() => {
        const newEvents = liveEvents.slice(processedCountRef.current);
        processedCountRef.current = liveEvents.length;
        if (newEvents.length === 0) return;

        const nodeUpdates: Record<string, NodeRunStatus> = {};
        for (const event of newEvents) {
            switch (event.topic) {
                case 'build-status':
                    patchBuildOverlay(buildId, {
                        status: event.data.buildStatus as PipelineBuildStatus,
                    });
                    break;
                case 'commit-info': {
                    const info = event.data as CommitInfo;
                    patchBuildOverlay(buildId, {
                        branch: info.branch,
                        commitHash: info.commitHash ?? null,
                        commitMessage: info.commitMessage ?? null,
                    });
                    break;
                }
                case 'node-status':
                    if (event.data?.nodeId) {
                        nodeUpdates[event.data.nodeId as string] = event.data
                            .nodeStatus as NodeRunStatus;
                    }
                    break;
            }
        }

        if (Object.keys(nodeUpdates).length > 0) {
            setBuildNodeStatuses(buildId, (prev) => ({ ...prev, ...nodeUpdates }));
        }
    }, [liveEvents, buildId, patchBuildOverlay, setBuildNodeStatuses]);

    return null;
}
