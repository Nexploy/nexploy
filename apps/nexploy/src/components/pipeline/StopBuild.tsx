'use client';

import { Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { BuildStatus } from 'generated/client';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { isBuildLive } from '@/utils/buildStatus';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

const STOPPABLE_STATUSES: BuildStatus[] = ['QUEUED', 'BUILDING'];

interface StopBuildProps {
    buildId: string;
    initialStatus: BuildStatus;
}

export function StopBuild({ buildId, initialStatus }: StopBuildProps) {
    const t = useTranslations('repository.pipeline');

    const isLive = isBuildLive(initialStatus);

    const { latestData } = useInngestSubscription({
        enabled: isLive,
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId,
                topics: ['build-status'],
            });
            return result?.data ?? null;
        },
    });

    const status = (latestData?.data?.buildStatus ?? initialStatus) as BuildStatus;

    if (!STOPPABLE_STATUSES.includes(status)) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-6 hover:border-destructive hover:text-destructive"
                    onClick={() => onCancelBuild({ buildId })}
                >
                    <Square className="size-3" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{t('stopBuild')}</TooltipContent>
        </Tooltip>
    );
}
