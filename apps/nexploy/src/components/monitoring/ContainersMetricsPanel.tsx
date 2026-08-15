'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Boxes, Cpu, HardDrive, MemoryStick, Network } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ContainersStatsState } from '@workspace/typescript-interface/stores/docker/containersStatsStore';
import { formatBytes } from '@/utils/formatBytes';
import { MetricCard } from '@/components/monitoring/MetricCard';
import { MetricAreaChart } from '@/components/monitoring/MetricAreaChart';
import { ContainersMetricsTable } from '@/components/monitoring/ContainersMetricsTable';
import { ContainerMetricsSheet } from '@/components/monitoring/ContainerMetricsSheet';
import {
    buildContainerSeries,
    buildMultiSeriesData,
    formatPercent,
    formatRate,
    MONITORING_CHART_COLORS,
    topContainersBy,
} from '@/components/monitoring/monitoringUtils';

interface ContainersMetricsPanelProps {
    stats: ContainersStatsState['stats'];
    totals: ContainersStatsState['totals'];
    history: ContainersStatsState['history'];
    totalsHistory: ContainersStatsState['totalsHistory'];
    isLoading: boolean;
}

export function ContainersMetricsPanel({
    stats,
    totals,
    history,
    totalsHistory,
    isLoading,
}: ContainersMetricsPanelProps) {
    const t = useTranslations('monitoring');
    const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

    const topCpuSeries = useMemo(
        () => buildContainerSeries(topContainersBy(stats, 'cpuPercent'), history),
        [stats, history],
    );

    const topMemorySeries = useMemo(
        () => buildContainerSeries(topContainersBy(stats, 'memoryUsage'), history),
        [stats, history],
    );

    const cpuChartData = useMemo(() => buildMultiSeriesData(topCpuSeries, 'cpuPercent'), [topCpuSeries]);

    const memoryChartData = useMemo(() => buildMultiSeriesData(topMemorySeries, 'memoryUsage'), [topMemorySeries]);

    const aggregatedChartData = useMemo(
        () =>
            totalsHistory.map((point) => ({
                timestamp: point.timestamp,
                cpuPercent: point.cpuPercent,
                memoryUsage: point.memoryUsage,
                networkRxRate: point.networkRxRate,
                networkTxRate: point.networkTxRate,
                blockReadRate: point.blockReadRate,
                blockWriteRate: point.blockWriteRate,
            })),
        [totalsHistory],
    );

    const selectedContainer = stats.find((stat) => stat.containerId === selectedContainerId) ?? null;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-[190px] w-full" />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <Skeleton key={index} className="h-[280px] w-full" />
                    ))}
                </div>
                <Skeleton className="h-[320px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title={t('containers.runningTitle')}
                    icon={Boxes}
                    value={`${totals?.runningCount ?? 0} / ${totals?.containerCount ?? 0}`}
                    description={t('containers.runningDescription')}
                    sparklineValues={totalsHistory.map((point) => point.runningCount)}
                />
                <MetricCard
                    title={t('containers.cpuTitle')}
                    icon={Cpu}
                    value={formatPercent(totals?.cpuPercent ?? 0)}
                    description={t('containers.cpuDescription')}
                    sparklineValues={totalsHistory.map((point) => point.cpuPercent)}
                />
                <MetricCard
                    title={t('containers.memoryTitle')}
                    icon={MemoryStick}
                    value={formatBytes(totals?.memoryUsage ?? 0)}
                    description={t('containers.memoryDescription')}
                    sparklineValues={totalsHistory.map((point) => point.memoryUsage)}
                />
                <MetricCard
                    title={t('containers.networkTitle')}
                    icon={Network}
                    value={formatRate((totals?.networkRxRate ?? 0) + (totals?.networkTxRate ?? 0))}
                    description={`↓ ${formatRate(totals?.networkRxRate ?? 0)} · ↑ ${formatRate(
                        totals?.networkTxRate ?? 0,
                    )}`}
                    sparklineValues={totalsHistory.map((point) => point.networkRxRate + point.networkTxRate)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <MetricAreaChart
                    title={t('containers.topCpuTitle')}
                    description={t('containers.topCpuDescription')}
                    data={cpuChartData}
                    series={topCpuSeries.map((entry) => ({
                        dataKey: entry.key,
                        label: entry.label,
                        color: entry.color,
                        stackId: 'cpu',
                    }))}
                    formatValue={(value) => formatPercent(value, 2)}
                    emptyLabel={t('waitingForData')}
                />
                <MetricAreaChart
                    title={t('containers.topMemoryTitle')}
                    description={t('containers.topMemoryDescription')}
                    data={memoryChartData}
                    series={topMemorySeries.map((entry) => ({
                        dataKey: entry.key,
                        label: entry.label,
                        color: entry.color,
                        stackId: 'memory',
                    }))}
                    formatValue={(value) => formatBytes(value)}
                    emptyLabel={t('waitingForData')}
                />
                <MetricAreaChart
                    title={t('containers.networkChartTitle')}
                    description={t('containers.networkChartDescription')}
                    data={aggregatedChartData}
                    series={[
                        {
                            dataKey: 'networkRxRate',
                            label: t('table.networkRx'),
                            color: MONITORING_CHART_COLORS[0]!,
                        },
                        {
                            dataKey: 'networkTxRate',
                            label: t('table.networkTx'),
                            color: MONITORING_CHART_COLORS[3]!,
                        },
                    ]}
                    formatValue={(value) => formatRate(value)}
                    emptyLabel={t('waitingForData')}
                />
                <MetricAreaChart
                    title={t('containers.blockChartTitle')}
                    description={t('containers.blockChartDescription')}
                    data={aggregatedChartData}
                    series={[
                        {
                            dataKey: 'blockReadRate',
                            label: t('table.blockRead'),
                            color: MONITORING_CHART_COLORS[2]!,
                        },
                        {
                            dataKey: 'blockWriteRate',
                            label: t('table.blockWrite'),
                            color: MONITORING_CHART_COLORS[4]!,
                        },
                    ]}
                    formatValue={(value) => formatRate(value)}
                    emptyLabel={t('waitingForData')}
                />
            </div>

            <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <HardDrive className="size-5 text-primary" />
                </div>
                <h2 className="font-semibold text-lg tracking-tight">{t('containers.tableTitle')}</h2>
            </div>

            <ContainersMetricsTable
                stats={stats}
                history={history}
                onSelect={(container) => setSelectedContainerId(container.containerId)}
            />

            <ContainerMetricsSheet
                container={selectedContainer}
                history={selectedContainer ? (history[selectedContainer.containerId] ?? []) : []}
                onOpenChange={(open) => {
                    if (!open) setSelectedContainerId(null);
                }}
            />
        </div>
    );
}
