'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';
import { Sparkline } from '@/components/monitoring/Sparkline';

interface MetricCardProps {
    title: string;
    icon: LucideIcon;
    value: string;
    description?: string;
    percent?: number;
    sparklineValues?: number[];
    sparklineMax?: number;
    valueClassName?: string;
    className?: string;
}

export function MetricCard({
    title,
    icon: Icon,
    value,
    description,
    percent,
    sparklineValues,
    sparklineMax,
    valueClassName,
    className,
}: MetricCardProps) {
    const boundedPercent = percent === undefined ? undefined : Math.max(0, Math.min(100, percent || 0));

    return (
        <Card className={cn('gap-3 py-5', className)}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 px-5">
                <CardTitle className="truncate font-medium text-muted-foreground text-sm">{title}</CardTitle>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="space-y-2 px-5">
                <div className={cn('font-semibold text-2xl tabular-nums', valueClassName)}>{value}</div>
                {description ? <p className="truncate text-muted-foreground text-xs">{description}</p> : null}
                {boundedPercent !== undefined ? (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${boundedPercent}%` }}
                        />
                    </div>
                ) : null}
                {sparklineValues ? (
                    <Sparkline values={sparklineValues} max={sparklineMax} className="h-8 opacity-80" />
                ) : null}
            </CardContent>
        </Card>
    );
}
