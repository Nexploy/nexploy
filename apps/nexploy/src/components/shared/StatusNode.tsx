'use client';

import { type ComponentProps } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import {
    Ban,
    CheckCircle2,
    CircleDashed,
    type LucideIcon,
    Loader2,
    Settings2,
    SkipForward,
    XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import type { NodeRunStatus } from '@workspace/typescript-interface/pipeline/pipeline';

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

interface StatusVisual {
    variant: BadgeVariant;
    icon: LucideIcon;
    labelKey: string;
    spin?: boolean;
}

const STATUS_VISUALS: Record<NodeRunStatus, StatusVisual> = {
    running: { variant: 'warning', icon: Loader2, labelKey: 'running', spin: true },
    completed: { variant: 'default', icon: CheckCircle2, labelKey: 'completed' },
    failed: { variant: 'destructive', icon: XCircle, labelKey: 'failed' },
    skipped: { variant: 'secondary', icon: SkipForward, labelKey: 'skipped' },
    cancelled: { variant: 'destructive', icon: Ban, labelKey: 'cancelled' },
    'not-configured': { variant: 'warning', icon: Settings2, labelKey: 'notConfigured' },
};

const PENDING_VISUAL: StatusVisual = {
    variant: 'outline',
    icon: CircleDashed,
    labelKey: 'pending',
};

export function StatusNode({ status }: { status?: NodeRunStatus }) {
    const t = useTranslations('repository.pipeline.nodeStatus');
    const { variant, icon: Icon, labelKey, spin } = (status && STATUS_VISUALS[status]) || PENDING_VISUAL;

    return (
        <Badge variant={variant}>
            <Icon className={cn('size-3', spin && 'animate-spin')} />
            {t(labelKey)}
        </Badge>
    );
}
