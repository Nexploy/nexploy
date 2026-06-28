'use client';

import { useCallback, useEffect, useState } from 'react';
import { BuildStatus } from 'generated/client';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useRealtime } from 'inngest/react';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';
import { isBuildLive } from '@/utils/buildStatus';
import { DurationNode } from '@/components/shared/DurationNode';

interface DurationLiveProps {
    buildId: string;
    initialStatus?: BuildStatus;
    createdAt: Date | string;
    updatedAt: Date | string;
    className?: string;
}

export function DurationLive({
    buildId,
    initialStatus,
    createdAt,
    updatedAt,
    className,
}: DurationLiveProps) {
    const [status, setStatus] = useState<BuildStatus | undefined>(initialStatus);
    const [finishedAt, setFinishedAt] = useState<number | undefined>(() =>
        initialStatus && !isBuildLive(initialStatus) ? new Date(updatedAt).getTime() : undefined,
    );

    const isLive = isBuildLive(status);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({ buildId, topics: ['build-status'] });
        if (!result?.data) throw new Error('Failed to get subscription token');
        return result.data;
    }, [buildId]);

    const { messages } = useRealtime({ enabled: isLive, token: refreshToken });

    const latestData = messages.last as BuildMessage | null;

    useEffect(() => {
        if (latestData?.topic !== 'build-status') return;
        const next = latestData.data.buildStatus as BuildStatus;
        setStatus(next);
        if (!isBuildLive(next)) setFinishedAt((prev) => prev ?? Date.now());
    }, [latestData]);

    const startedAt = new Date(createdAt).getTime();
    const durationMs =
        !isLive && finishedAt !== undefined ? Math.max(0, finishedAt - startedAt) : undefined;

    return (
        <DurationNode
            isRunning={isLive}
            startedAt={startedAt}
            durationMs={durationMs}
            className={className}
        />
    );
}
