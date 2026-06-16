'use client';

import { useCallback } from 'react';
import { BuildStatus } from 'generated/client';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useRealtime } from 'inngest/react';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';
import { isBuildLive } from '@/utils/buildStatus';
import { StatusView } from '@/components/shared/StatusView';

interface StatusBadgeProps {
    initialStatus?: BuildStatus;
    buildId: string | null;
    displayType?: 'badge' | 'dot';
}

export function StatusLive({ initialStatus, buildId, displayType = 'badge' }: StatusBadgeProps) {
    const isLive = isBuildLive(initialStatus);

    const refreshToken = useCallback(async () => {
        if (!buildId) throw new Error('Missing buildId');
        const result = await onGetTokenBuildIdAction({
            buildId,
            topics: ['build-status'],
        });
        if (!result?.data) throw new Error('Failed to get subscription token');
        return result.data;
    }, [buildId]);

    const { messages } = useRealtime({ enabled: isLive, token: refreshToken });

    const latestData = messages.last as BuildMessage | null;
    const status = (latestData?.data?.buildStatus ?? initialStatus) as BuildStatus;

    return <StatusView status={status} displayType={displayType} />;
}
