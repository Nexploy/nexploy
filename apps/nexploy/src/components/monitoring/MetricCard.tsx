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
}: MetricCardProps) {
    const boundedPercent = percent === undefined ? undefined : Math.max(0, Math.min(100, percent || 0));

    return (
        <Card className="gap-3 py-5">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 px-5">
                <CardTitle className="text-muted-foreground truncate text-sm font-medium">{title}</CardTitle>
                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-primary size-4" />
                </div>
            </CardHeader>
            <CardContent className="space-y-2 px-5">
                <div className={cn('text-2xl font-semibold tabular-nums', valueClassName)}>{value}</div>
                {description ? <p className="text-muted-foreground truncate text-xs">{description}</p> : null}
                {boundedPercent !== undefined ? (
                    <div className="bg-primary/15 h-1.5 w-full overflow-hidden rounded-full">
                        <div
                            className="bg-primary h-full rounded-full transition-all"
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
