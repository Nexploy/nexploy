'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { useRealtime } from 'inngest/react';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { usePipelineStoreInstance } from '@/contexts/PipelineContext';
import { isBuildLive } from '@/utils/buildStatus';
import { type CommitInfo, type NodeRunStatus } from '@nexploy/nodes/core/pipeline';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';
import type {
    NodeProgressState,
    NodeSummaryState,
    PipelineBuildStatus,
} from '@workspace/typescript-interface/stores/pipelineStore';

export function BuildTracker({ buildId, initialStatus }: { buildId: string; initialStatus: PipelineBuildStatus }) {
    const store = usePipelineStoreInstance();
    const patchBuildOverlay = useStore(store, (s) => s.patchBuildOverlay);
    const setBuildNodeStatuses = useStore(store, (s) => s.setBuildNodeStatuses);
    const setBuildNodeDurations = useStore(store, (s) => s.setBuildNodeDurations);
    const setBuildNodeStartTimes = useStore(store, (s) => s.setBuildNodeStartTimes);
    const setBuildNodeProgress = useStore(store, (s) => s.setBuildNodeProgress);
    const setBuildNodeSummaries = useStore(store, (s) => s.setBuildNodeSummaries);

    const status = useStore(store, (s) => s.buildOverlays[buildId]?.status ?? initialStatus);
    const isLive = isBuildLive(status);

    const processedCountRef = useRef(0);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId,
            topics: ['build-status', 'commit-info', 'node-status', 'node-progress', 'node-summary'],
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
        const progressUpdates: Record<string, NodeProgressState> = {};
        const summaryUpdates: Record<string, NodeSummaryState> = {};
        const resetNodeIds = new Set<string>();
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
                        const nodeId = event.data.nodeId as string;
                        const nodeStatus = event.data.nodeStatus as NodeRunStatus;
                        nodeUpdates[nodeId] = nodeStatus;
                        if (typeof event.data.durationMs === 'number') {
                            durationUpdates[nodeId] = event.data.durationMs;
                        }
                        if (typeof event.data.startedAt === 'number') {
                            startTimeUpdates[nodeId] = event.data.startedAt;
                        }
                        if (nodeStatus === 'running') {
                            resetNodeIds.add(nodeId);
                        }
                    }
                    break;
                case 'node-progress':
                    if (event.data?.nodeId) {
                        const { nodeId, ...progress } = event.data;
                        progressUpdates[nodeId as string] = progress as NodeProgressState;
                    }
                    break;
                case 'node-summary':
                    if (event.data?.nodeId) {
                        const { nodeId, ...summary } = event.data;
                        summaryUpdates[nodeId as string] = summary as NodeSummaryState;
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
        if (resetNodeIds.size > 0 || Object.keys(progressUpdates).length > 0) {
            setBuildNodeProgress(buildId, (prev) => {
                const next = { ...prev };
                for (const nodeId of resetNodeIds) delete next[nodeId];
                return { ...next, ...progressUpdates };
            });
        }
        if (resetNodeIds.size > 0 || Object.keys(summaryUpdates).length > 0) {
            setBuildNodeSummaries(buildId, (prev) => {
                const next = { ...prev };
                for (const nodeId of resetNodeIds) delete next[nodeId];
                return { ...next, ...summaryUpdates };
            });
        }
    }, [
        liveEvents,
        buildId,
        patchBuildOverlay,
        setBuildNodeStatuses,
        setBuildNodeDurations,
        setBuildNodeStartTimes,
        setBuildNodeProgress,
        setBuildNodeSummaries,
    ]);

    return null;
}
