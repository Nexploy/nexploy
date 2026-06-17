'use client';

import { Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BuildStatus } from 'generated/client';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { usePermissions } from '@/contexts/PermissionContext';
import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils.ts';
import type { VariantProps } from 'class-variance-authority';

const STOPPABLE_STATUSES: BuildStatus[] = ['QUEUED', 'BUILDING'];

interface StopBuildToolbarProps {
    buildId: string | null;
    status: BuildStatus;
}

export function StopBuild({
    buildId,
    status,
    ...props
}: StopBuildToolbarProps & React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
    const t = useTranslations('repository.pipeline');
    const { can } = usePermissions();

    // if (!STOPPABLE_STATUSES.includes(status) || !can('build', 'cancel')) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    {...props}
                    size="icon"
                    className={cn(
                        'hover:border-destructive hover:text-destructive size-6',
                        props.className,
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        buildId && onCancelBuild({ buildId });
                    }}
                >
                    <Square className="size-3" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{t('stopBuild')}</TooltipContent>
        </Tooltip>
    );
}
