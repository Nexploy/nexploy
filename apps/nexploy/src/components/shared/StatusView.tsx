'use client';

import { Badge, badgeVariants } from '@workspace/ui/components/badge';
import { BuildStatus } from 'generated/client';
import { Ban, CheckCircle2, Clock, Hourglass, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { STATUS_PIPELINE } from '@/components/shared/buildStatusMapping';
import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils.ts';

interface StatusViewProps {
    status?: BuildStatus;
    displayType?: 'badge' | 'dot';
}

export function StatusView({
    status,
    displayType = 'badge',
    ...props
}: StatusViewProps & React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
    const t = useTranslations('repository.builds');

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
                <Badge {...props} variant="default" className={cn('gap-1', props.className)}>
                    <CheckCircle2 className="size-3" />
                    {t('completed')}
                </Badge>
            );
        case 'FAILED':
            return (
                <Badge {...props} variant="destructive" className={cn('gap-1', props.className)}>
                    <XCircle className="size-3" />
                    {t('failed')}
                </Badge>
            );
        case 'CANCELLED':
            return (
                <Badge {...props} variant="destructive" className={cn('gap-1', props.className)}>
                    <Ban className="size-3" />
                    {t('cancelled')}
                </Badge>
            );
        case 'BUILDING':
            return (
                <Badge {...props} variant="warning" className={cn('gap-1', props.className)}>
                    <Loader2 className="size-3 animate-spin" />
                    {t('building')}
                </Badge>
            );
        case 'QUEUED':
            return (
                <Badge {...props} variant="secondary" className={cn('gap-1', props.className)}>
                    <Clock className="size-3" />
                    {t('queued')}
                </Badge>
            );
        default:
            return (
                <Badge {...props} variant="outline" className={cn('gap-1', props.className)}>
                    <Hourglass className="size-3" />
                    {t('noBuild')}
                </Badge>
            );
    }
}
