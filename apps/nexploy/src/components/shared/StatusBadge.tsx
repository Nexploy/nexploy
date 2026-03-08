'use client';

import { Badge } from '@workspace/ui/components/badge';
import { BuildStatus } from 'generated/client';
import { CheckCircle2, Clock, Hourglass, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatusBadgeProps {
    status?: BuildStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const t = useTranslations('repository.builds');

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
                    <XCircle className="size-3" />
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
