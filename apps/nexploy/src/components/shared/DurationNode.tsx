'use client';

import { useEffect, useState } from 'react';
import { Badge, badgeVariants } from '@workspace/ui/components/badge';
import { Clock } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { formatDuration } from '@/utils/time';
import type { VariantProps } from 'class-variance-authority';

interface DurationNodeProps extends VariantProps<typeof badgeVariants> {
    isRunning: boolean;
    durationMs?: number;
    startedAt?: number;
    className?: string;
}

export function DurationNode({
    isRunning,
    durationMs,
    startedAt,
    className,
    variant = 'outline',
}: DurationNodeProps) {
    const [now, setNow] = useState<number>(() => Date.now());

    useEffect(() => {
        if (!isRunning || startedAt === undefined) return;
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, [isRunning, startedAt]);

    const elapsedMs =
        isRunning && startedAt !== undefined
            ? Math.max(0, now - startedAt)
            : !isRunning
              ? durationMs
              : undefined;

    if (elapsedMs === undefined) return null;

    return (
        <Badge variant={variant} className={cn('tabular-nums', className)}>
            <Clock className="size-3" />
            {formatDuration(elapsedMs)}
        </Badge>
    );
}
