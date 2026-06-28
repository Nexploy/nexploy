'use client';

import { useCallback, useEffect, useState } from 'react';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useRealtime } from 'inngest/react';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';
import type { NodeRunStatus } from '@workspace/typescript-interface/pipeline/pipeline';
import { StatusNode } from '@/components/shared/StatusNode';
import { DurationNode } from '@/components/shared/DurationNode';

interface StatusNodeLiveProps {
    buildId: string;
    nodeId: string;
    initialStatus?: NodeRunStatus;
    initialDurationMs?: number;
    initialStartedAt?: number;
}

export function StatusNodeLive({
    buildId,
    nodeId,
    initialStatus,
    initialDurationMs,
    initialStartedAt,
}: StatusNodeLiveProps) {
    const [status, setStatus] = useState<NodeRunStatus | undefined>(initialStatus);
    const [durationMs, setDurationMs] = useState<number | undefined>(initialDurationMs);
    const [startedAt, setStartedAt] = useState<number | undefined>(initialStartedAt);

    const isLive = status === 'running' || status === undefined;

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({ buildId, topics: ['node-status'] });
        if (!result?.data) throw new Error('Failed to get subscription token');
        return result.data;
    }, [buildId]);

    const { messages } = useRealtime({ enabled: isLive, token: refreshToken });

    const latestData = messages.last as BuildMessage | null;

    useEffect(() => {
        if (latestData?.topic === 'node-status' && latestData.data?.nodeId === nodeId) {
            setStatus(latestData.data.nodeStatus as NodeRunStatus);
            setDurationMs(latestData.data.durationMs);
            setStartedAt(latestData.data.startedAt);
        }
    }, [latestData, nodeId]);

    return (
        <div className="flex items-center gap-2">
            <StatusNode status={status} />
            <DurationNode
                isRunning={status === 'running'}
                durationMs={durationMs}
                startedAt={startedAt}
            />
        </div>
    );
}
