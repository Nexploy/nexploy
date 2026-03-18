'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Ban, CheckCircle2, CircleDashed, Loader2, SkipForward, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { NodeRunStatus } from '@/types/pipeline.type';

interface StatusNodeLiveProps {
    buildId: string;
    nodeId: string;
    initialStatus?: NodeRunStatus;
}

export function StatusNodeLive({ buildId, nodeId, initialStatus }: StatusNodeLiveProps) {
    const t = useTranslations('repository.pipeline.nodeStatus');
    const [status, setStatus] = useState<NodeRunStatus | undefined>(initialStatus);

    const isLive = status === 'running' || status === undefined;

    const { latestData } = useInngestSubscription({
        enabled: isLive,
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({ buildId, topics: ['node-status'] });
            return result?.data ?? null;
        },
    });

    useEffect(() => {
        if (latestData?.topic === 'node-status' && latestData.data?.nodeId === nodeId) {
            setStatus(latestData.data.nodeStatus as NodeRunStatus);
        }
    }, [latestData, nodeId]);

    switch (status) {
        case 'running':
            return (
                <Badge variant="warning" className="gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    {t('running')}
                </Badge>
            );
        case 'completed':
            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    {t('completed')}
                </Badge>
            );
        case 'failed':
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3" />
                    {t('failed')}
                </Badge>
            );
        case 'skipped':
            return (
                <Badge variant="secondary" className="gap-1">
                    <SkipForward className="size-3" />
                    {t('skipped')}
                </Badge>
            );
        case 'cancelled':
            return (
                <Badge variant="destructive" className="gap-1">
                    <Ban className="size-3" />
                    {t('cancelled')}
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="gap-1">
                    <CircleDashed className="size-3" />
                    {t('pending')}
                </Badge>
            );
    }
}
