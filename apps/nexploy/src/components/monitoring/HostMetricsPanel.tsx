'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Cpu, Gauge, HardDrive, MemoryStick, Server } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { SystemMetrics } from '@workspace/typescript-interface/monitoring/system.metrics';
import { formatBytes } from '@/utils/formatBytes';
import { MetricCard } from '@/components/monitoring/MetricCard';
import { MetricAreaChart } from '@/components/monitoring/MetricAreaChart';
import {
    formatPercent,
    MONITORING_CHART_COLORS,
    splitDuration,
    usageToneClass,
} from '@/components/monitoring/monitoringUtils';
import { cn } from '@workspace/ui/lib/utils';

interface HostMetricsPanelProps {
    metrics: SystemMetrics | null;
    history: SystemMetrics[];
    isLoading: boolean;
}

export function HostMetricsPanel({ metrics, history, isLoading }: HostMetricsPanelProps) {
    const t = useTranslations('monitoring');

    const chartData = useMemo(
        () =>
            history.map((entry) => ({
                timestamp: entry.timestamp,
                cpuPercent: entry.cpuPercent,
                memoryPercent: entry.memoryPercent,
                memoryUsed: entry.memoryUsed,
                diskUsed: entry.diskUsed,
                load1: entry.loadAverage?.[0] ?? 0,
                load5: entry.loadAverage?.[1] ?? 0,
                load15: entry.loadAverage?.[2] ?? 0,
            })),
        [history],
    );

    const uptime = splitDuration(metrics?.uptime ?? 0);
    const cpuCores = metrics?.cpuCoresPercent ?? [];
    const loadAverage = metrics?.loadAverage ?? [];
    const normalizedLoad = metrics?.cpuCount ? ((loadAverage[0] ?? 0) / metrics.cpuCount) * 100 : undefined;

    const hostDetails = [
        { label: t('host.hostname'), value: metrics?.hostname ?? '—' },
        { label: t('host.platform'), value: `${metrics?.platform ?? '—'} ${metrics?.arch ?? ''}` },
        { label: t('host.kernel'), value: metrics?.release ?? '—' },
        { label: t('host.cpuModel'), value: metrics?.cpuModel ?? '—' },
        { label: t('host.cores'), value: `${metrics?.cpuCount ?? 0}` },
        {
            label: t('host.memoryTotal'),
            value: formatBytes(metrics?.memoryTotal ?? 0),
        },
        { label: t('host.diskTotal'), value: formatBytes(metrics?.diskTotal ?? 0) },
        {
            label: t('host.diskFree'),
            value: formatBytes(metrics?.diskFree ?? 0),
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-[190px] w-full" />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-[280px] w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title={t('cpuUsage')}
                    icon={Cpu}
                    value={formatPercent(metrics?.cpuPercent ?? 0)}
                    valueClassName={usageToneClass(metrics?.cpuPercent ?? 0)}
                    description={t('host.cpuDetails', {
                        cores: metrics?.cpuCount ?? 0,
                        load: (loadAverage[0] ?? 0).toFixed(2),
                    })}
                    percent={metrics?.cpuPercent ?? 0}
                    sparklineValues={chartData.map((point) => point.cpuPercent)}
                    sparklineMax={100}
                />
                <MetricCard
                    title={t('memory')}
                    icon={MemoryStick}
                    value={formatPercent(metrics?.memoryPercent ?? 0)}
                    valueClassName={usageToneClass(metrics?.memoryPercent ?? 0)}
                    description={`${formatBytes(metrics?.memoryUsed ?? 0)} / ${formatBytes(metrics?.memoryTotal ?? 0)}`}
                    percent={metrics?.memoryPercent ?? 0}
                    sparklineValues={chartData.map((point) => point.memoryPercent)}
                    sparklineMax={100}
                />
                <MetricCard
                    title={t('disk')}
                    icon={HardDrive}
                    value={formatPercent(metrics?.diskPercent ?? 0)}
                    valueClassName={usageToneClass(metrics?.diskPercent ?? 0)}
                    description={`${formatBytes(metrics?.diskUsed ?? 0)} / ${formatBytes(metrics?.diskTotal ?? 0)}`}
                    percent={metrics?.diskPercent ?? 0}
                />
                <MetricCard
                    title={t('uptime')}
                    icon={Clock}
                    value={t('host.uptimeValue', uptime)}
                    description={`${metrics?.hostname ?? '—'} • ${metrics?.platform ?? '—'}`}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <MetricAreaChart
                    title={t('cpuUsagePercent')}
                    description={t('cpuUsageDescription')}
                    data={chartData}
                    series={[
                        {
                            dataKey: 'cpuPercent',
                            label: t('cpuUsage'),
                            color: MONITORING_CHART_COLORS[0]!,
                        },
                    ]}
                    formatValue={(value) => formatPercent(value)}
                    yDomain={[0, 100]}
                    emptyLabel={t('waitingForData')}
                />
                <MetricAreaChart
                    title={t('memoryUsagePercent')}
                    description={t('memoryUsageDescription')}
                    data={chartData}
                    series={[
                        {
                            dataKey: 'memoryPercent',
                            label: t('memory'),
                            color: MONITORING_CHART_COLORS[1]!,
                        },
                    ]}
                    formatValue={(value) => formatPercent(value)}
                    yDomain={[0, 100]}
                    emptyLabel={t('waitingForData')}
                />
                <MetricAreaChart
                    title={t('host.memoryUsedTitle')}
                    description={t('host.memoryUsedDescription')}
                    data={chartData}
                    series={[
                        {
                            dataKey: 'memoryUsed',
                            label: t('host.memoryUsed'),
                            color: MONITORING_CHART_COLORS[2]!,
                        },
                    ]}
                    formatValue={(value) => formatBytes(value)}
                    emptyLabel={t('waitingForData')}
                />
                <MetricAreaChart
                    title={t('host.loadAverageTitle')}
                    description={t('host.loadAverageDescription')}
                    data={chartData}
                    series={[
                        {
                            dataKey: 'load1',
                            label: t('host.load1'),
                            color: MONITORING_CHART_COLORS[0]!,
                        },
                        {
                            dataKey: 'load5',
                            label: t('host.load5'),
                            color: MONITORING_CHART_COLORS[2]!,
                        },
                        {
                            dataKey: 'load15',
                            label: t('host.load15'),
                            color: MONITORING_CHART_COLORS[4]!,
                        },
                    ]}
                    formatValue={(value) => value.toFixed(2)}
                    emptyLabel={t('waitingForData')}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeaderWithIcon icon={Gauge} title={t('host.perCoreTitle')}>
                        {normalizedLoad !== undefined ? (
                            <span className="ml-auto text-muted-foreground text-xs">
                                {t('host.normalizedLoad', {
                                    value: formatPercent(normalizedLoad),
                                })}
                            </span>
                        ) : null}
                    </CardHeaderWithIcon>
                    <CardContent>
                        {cpuCores.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('waitingForData')}</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
                                {cpuCores.map((corePercent, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {t('host.core', { index: index + 1 })}
                                            </span>
                                            <span className={cn('tabular-nums', usageToneClass(corePercent))}>
                                                {formatPercent(corePercent, 0)}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{
                                                    width: `${Math.max(0, Math.min(100, corePercent))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeaderWithIcon icon={Server} title={t('host.systemTitle')} />
                    <CardContent>
                        <div className="space-y-3">
                            {hostDetails.map((detail, index) => (
                                <div
                                    key={detail.label}
                                    className={cn(
                                        'grid grid-cols-[auto_1fr] items-center gap-4',
                                        index < hostDetails.length - 1 && 'border-b pb-2',
                                    )}
                                >
                                    <span className="whitespace-nowrap text-muted-foreground text-sm">
                                        {detail.label}
                                    </span>
                                    <div className="flex min-w-0 justify-end overflow-hidden">
                                        <Badge variant="secondary" className="w-auto max-w-full shrink">
                                            <span className="block truncate" title={detail.value}>
                                                {detail.value}
                                            </span>
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeaderWithIcon
                    icon={HardDrive}
                    title={t('host.diskTitle')}
                    description={t('host.diskFreeValue', {
                        value: formatBytes(metrics?.diskFree ?? 0),
                    })}
                />
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('host.diskUsed')}</span>
                        <Badge variant="secondary" className="tabular-nums">
                            {formatBytes(metrics?.diskUsed ?? 0)} / {formatBytes(metrics?.diskTotal ?? 0)}
                        </Badge>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                                width: `${Math.max(0, Math.min(100, metrics?.diskPercent ?? 0))}%`,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
