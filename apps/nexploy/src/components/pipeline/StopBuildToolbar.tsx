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
import { usePermissions } from '@/contexts/PermissionContext';

const STOPPABLE_STATUSES: BuildStatus[] = ['QUEUED', 'BUILDING'];

interface StopBuildToolbarProps {
    buildId: string | null;
    initialStatus: BuildStatus;
}

export function StopBuildToolbar({ buildId, initialStatus }: StopBuildToolbarProps) {
    const t = useTranslations('repository.pipeline');
    const { can } = usePermissions();

    const isLive = isBuildLive(initialStatus);

    const refreshToken = async () => {
        if (!buildId) return null;
        const result = await onGetTokenBuildIdAction({
            buildId,
            topics: ['build-status'],
        });
        return result?.data ?? null;
    };

    const { latestData } = useInngestSubscription({
        enabled: isLive,
        refreshToken,
    });

    const status = (latestData?.data?.buildStatus ?? initialStatus) as BuildStatus;

    if (!STOPPABLE_STATUSES.includes(status) || !can('build', 'cancel')) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="hover:border-destructive hover:text-destructive size-6"
                    onClick={() => buildId && onCancelBuild({ buildId })}
                >
                    <Square className="size-3" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{t('stopBuild')}</TooltipContent>
        </Tooltip>
    );
}
