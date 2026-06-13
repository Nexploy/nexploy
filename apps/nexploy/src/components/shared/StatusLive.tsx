'use client';

import { BuildStatus } from 'generated/client';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { isBuildLive } from '@/utils/buildStatus';
import { StatusView } from '@/components/shared/StatusView';

interface StatusBadgeProps {
    initialStatus?: BuildStatus;
    buildId: string | null;
    displayType?: 'badge' | 'dot';
}

export function StatusLive({ initialStatus, buildId, displayType = 'badge' }: StatusBadgeProps) {
    const refreshToken = async () => {
        if (!buildId) return null;
        const result = await onGetTokenBuildIdAction({
            buildId,
            topics: ['build-status'],
        });
        return result?.data ?? null;
    };

    const isLive = isBuildLive(initialStatus);

    const { latestData } = useInngestSubscription({
        enabled: isLive,
        refreshToken,
    });

    const status = (latestData?.data?.buildStatus ?? initialStatus) as BuildStatus;

    return <StatusView status={status} displayType={displayType} />;
}
