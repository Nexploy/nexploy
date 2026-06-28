'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { useRealtime } from 'inngest/react';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { usePipelineStoreInstance } from '@/contexts/PipelineContext';
import { isBuildLive } from '@/utils/buildStatus';
import { type CommitInfo, type NodeRunStatus } from '@workspace/typescript-interface/pipeline/pipeline';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';
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
    const setBuildNodeDurations = useStore(store, (s) => s.setBuildNodeDurations);
    const setBuildNodeStartTimes = useStore(store, (s) => s.setBuildNodeStartTimes);

    const status = useStore(store, (s) => s.buildOverlays[buildId]?.status ?? initialStatus);
    const isLive = isBuildLive(status);

    const processedCountRef = useRef(0);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId,
            topics: ['build-status', 'commit-info', 'node-status'],
        });
        if (!result?.data) throw new Error('Failed to get subscription token');
        return result.data;
    }, [buildId]);

    const { messages } = useRealtime({ enabled: isLive, token: refreshToken });
    const liveEvents = messages.all as BuildMessage[];

    useEffect(() => {
        const newEvents = liveEvents.slice(processedCountRef.current);
        processedCountRef.current = liveEvents.length;
        if (newEvents.length === 0) return;

        const nodeUpdates: Record<string, NodeRunStatus> = {};
        const durationUpdates: Record<string, number> = {};
        const startTimeUpdates: Record<string, number> = {};
        for (const event of newEvents) {
            switch (event.topic) {
                case 'build-status': {
                    const buildStatus = event.data.buildStatus as PipelineBuildStatus;
                    patchBuildOverlay(buildId, {
                        status: buildStatus,
                        ...(isBuildLive(buildStatus) ? {} : { finishedAt: Date.now() }),
                    });
                    break;
                }
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
                        if (typeof event.data.durationMs === 'number') {
                            durationUpdates[event.data.nodeId as string] = event.data.durationMs;
                        }
                        if (typeof event.data.startedAt === 'number') {
                            startTimeUpdates[event.data.nodeId as string] = event.data.startedAt;
                        }
                    }
                    break;
            }
        }

        if (Object.keys(nodeUpdates).length > 0) {
            setBuildNodeStatuses(buildId, (prev) => ({ ...prev, ...nodeUpdates }));
        }
        if (Object.keys(durationUpdates).length > 0) {
            setBuildNodeDurations(buildId, (prev) => ({ ...prev, ...durationUpdates }));
        }
        if (Object.keys(startTimeUpdates).length > 0) {
            setBuildNodeStartTimes(buildId, (prev) => ({ ...prev, ...startTimeUpdates }));
        }
    }, [
        liveEvents,
        buildId,
        patchBuildOverlay,
        setBuildNodeStatuses,
        setBuildNodeDurations,
        setBuildNodeStartTimes,
    ]);

    return null;
}
