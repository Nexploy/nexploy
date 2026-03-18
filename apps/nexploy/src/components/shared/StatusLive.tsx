'use client';

import { Badge } from '@workspace/ui/components/badge';
import { BuildStatus } from 'generated/client';
import { Ban, CheckCircle2, Clock, Hourglass, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { isBuildLive } from '@/utils/buildStatus';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { STATUS_PIPELINE } from '@/components/pipeline/buildsPanel/BuildsPanelItem';

interface StatusBadgeProps {
    initialStatus?: BuildStatus;
    buildId: string | null;
    displayType?: 'badge' | 'dot';
}

export function StatusLive({ initialStatus, buildId, displayType = 'badge' }: StatusBadgeProps) {
    const t = useTranslations('repository.builds');

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

    if (displayType === 'dot') {
        return (
            <Status
                className={'rounded-none border-0 p-1'}
                status={STATUS_PIPELINE[status ?? 'CANCELLED']}
                variant="outline"
            >
                <StatusIndicator />
            </Status>
        );
    }

    switch (status) {
        case 'COMPLETED':
            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    {t('completed')}
                </Badge>
            );
        case 'FAILED':
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3" />
                    {t('failed')}
                </Badge>
            );
        case 'CANCELLED':
            return (
                <Badge variant="destructive" className="gap-1">
                    <Ban className="size-3" />
                    {t('cancelled')}
                </Badge>
            );
        case 'BUILDING':
            return (
                <Badge variant="warning">
                    <Loader2 className="size-3 animate-spin" />
                    {t('building')}
                </Badge>
            );
        case 'QUEUED':
            return (
                <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" />
                    {t('queued')}
                </Badge>
            );
        default:
            return (
                <Badge variant="outline">
                    <Hourglass className="size-3" />
                    {t('noBuild')}
                </Badge>
            );
    }
}
