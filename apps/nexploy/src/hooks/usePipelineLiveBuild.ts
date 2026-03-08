'use client';

import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { type NodeRunStatus } from '@/types/pipeline.type';

interface UsePipelineLiveBuildOptions {
    buildId?: string;
}

export function usePipelineLiveBuild({ buildId }: UsePipelineLiveBuildOptions) {
    const { updateNodeData, getNodes } = useReactFlow();

    // Stable refs — always current, no stale closure risk
    const updateNodeDataRef = useRef(updateNodeData);
    const getNodesRef = useRef(getNodes);
    updateNodeDataRef.current = updateNodeData;
    getNodesRef.current = getNodes;

    // Cursor so we only process events we haven't seen yet
    const processedCountRef = useRef(0);

    const { data } = useInngestSubscription({
        enabled: !!buildId,
        refreshToken: async () => {
            if (!buildId) return null;
            const result = await onGetTokenBuildIdAction({
                buildId,
                topics: ['node-status', 'status'],
            });
            return result?.data ?? null;
        },
    });

    // Reset all run statuses when buildId disappears (build gone or tab switched)
    useEffect(() => {
        if (buildId) return;
        for (const node of getNodesRef.current()) {
            updateNodeDataRef.current(node.id, { runStatus: undefined });
        }
    }, [buildId]);

    // Process only new events — node-status updates and build completion
    useEffect(() => {
        if (!buildId) return;

        const newEvents = data.slice(processedCountRef.current);
        processedCountRef.current = data.length;

        for (const evt of newEvents) {
            if (evt.topic === 'node-status' && evt.data?.nodeId) {
                updateNodeDataRef.current(evt.data.nodeId, {
                    runStatus: evt.data.status as NodeRunStatus,
                });
            }

            if (evt.topic === 'status' && evt.data?.status === 'COMPLETED') {
                for (const node of getNodesRef.current()) {
                    if (!node.data.runStatus) {
                        updateNodeDataRef.current(node.id, {
                            runStatus: 'completed' as NodeRunStatus,
                        });
                    }
                }
            }
        }
    }, [data, buildId]);
}
