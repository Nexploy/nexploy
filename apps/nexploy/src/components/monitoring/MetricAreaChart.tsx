'use client';

import * as React from 'react';
import { useId, useMemo } from 'react';
import dayjs from 'dayjs';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@workspace/ui/components/chart';
import { cn } from '@workspace/ui/lib/utils';

export interface MetricSeries {
    dataKey: string;
    label: string;
    color: string;
    stackId?: string;
}

interface MetricAreaChartProps {
    title: string;
    description?: string;
    data: Array<Record<string, number>>;
    series: MetricSeries[];
    formatValue: (value: number) => string;
    yDomain?: [number | 'auto', number | 'auto'];
    className?: string;
    chartClassName?: string;
    emptyLabel?: string;
    showLegend?: boolean;
}

export function MetricAreaChart({
    title,
    description,
    data,
    series,
    formatValue,
    yDomain,
    className,
    chartClassName,
    emptyLabel,
    showLegend = false,
}: MetricAreaChartProps) {
    const gradientPrefix = useId().replace(/:/g, '');
    const config = useMemo(
        () =>
            series.reduce<ChartConfig>(
                (acc, entry) => ({
                    ...acc,
                    [entry.dataKey]: { label: entry.label, color: entry.color },
                }),
                {},
            ),
        [series],
    );

    const hasData = data.length > 0 && series.length > 0;

    return (
        <Card className={cn('gap-0 py-4', className)}>
            <CardHeader className="pb-4! border-b px-4">
                <CardTitle className="text-base">{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="p-0 pt-2">
                {hasData ? (
                    <ChartContainer config={config} className={cn('h-[220px] w-full', chartClassName)}>
                        <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) => dayjs(value).format('HH:mm:ss')}
                            />
                            <YAxis
                                width={64}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={4}
                                domain={yDomain}
                                tickFormatter={(value) => formatValue(Number(value))}
                            />
                            <ChartTooltip
                                content={(props) => (
                                    <ChartTooltipContent
                                        {...(props as React.ComponentProps<typeof ChartTooltipContent>)}
                                        labelFormatter={(_, payload) =>
                                            dayjs(payload?.[0]?.payload?.timestamp).format('HH:mm:ss')
                                        }
                                        formatter={(value) => formatValue(Number(value))}
                                    />
                                )}
                            />
                            <defs>
                                {series.map((entry) => (
                                    <linearGradient
                                        key={entry.dataKey}
                                        id={`fill-${gradientPrefix}-${entry.dataKey}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="5%" stopColor={entry.color} stopOpacity={0.7} />
                                        <stop offset="95%" stopColor={entry.color} stopOpacity={0.05} />
                                    </linearGradient>
                                ))}
                            </defs>
                            {series.map((entry) => (
                                <Area
                                    key={entry.dataKey}
                                    dataKey={entry.dataKey}
                                    type="monotone"
                                    stackId={entry.stackId}
                                    fill={`url(#fill-${gradientPrefix}-${entry.dataKey})`}
                                    fillOpacity={0.5}
                                    stroke={entry.color}
                                    strokeWidth={1.5}
                                    isAnimationActive={false}
                                    dot={false}
                                />
                            ))}
                            {showLegend && series.length > 1 ? <ChartLegend content={<ChartLegendContent />} /> : null}
                        </AreaChart>
                    </ChartContainer>
                ) : (
                    <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
                        {emptyLabel}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
