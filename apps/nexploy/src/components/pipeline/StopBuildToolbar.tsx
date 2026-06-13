'use client';

import { Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BuildStatus } from 'generated/client';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { usePermissions } from '@/contexts/PermissionContext';

const STOPPABLE_STATUSES: BuildStatus[] = ['QUEUED', 'BUILDING'];

interface StopBuildToolbarProps {
    buildId: string | null;
    status: BuildStatus;
}

export function StopBuildToolbar({ buildId, status }: StopBuildToolbarProps) {
    const t = useTranslations('repository.pipeline');
    const { can } = usePermissions();

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
