'use client';

import { useTranslations } from 'next-intl';
import type { ActivityStatus } from '@workspace/typescript-interface/activity';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';

const STATUS_CLASSES: Record<ActivityStatus, string> = {
    SUCCESS: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    FAILURE: 'border-destructive/30 bg-destructive/10 text-destructive',
    DENIED: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
    const t = useTranslations('admin.activity');

    return (
        <Badge variant="outline" className={cn('font-medium', STATUS_CLASSES[status])}>
            {t(`status.${status}`)}
        </Badge>
    );
}
