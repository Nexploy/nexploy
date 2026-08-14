'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Activity, Cpu, Download, HardDrive, MemoryStick, Network } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { SSEProvider } from '@/providers/SSEProviders';
import { useContainerStatsStore } from '@/stores/docker/useContainerStatsStore';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { Separator } from '@workspace/ui/components/separator';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { formatBytes } from '@/utils/formatBytes';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useLocalStorage } from 'usehooks-ts';
import { refreshRateOptions } from '@/utils/refreshRate';
import { useTranslations } from 'next-intl';
import { MetricCard } from '@/components/monitoring/MetricCard';
import { MetricAreaChart } from '@/components/monitoring/MetricAreaChart';
import {
    formatPercent,
    formatRate,
    MONITORING_CHART_COLORS,
    usageToneClass,
} from '@/components/monitoring/monitoringUtils';

interface ContainerStatsProps {
    children: (props: { openStats: () => void }) => ReactNode;
}

export function ContainerStats({ children }: ContainerStatsProps) {
    const [open, setOpen] = useState(false);
    const [refreshRate, setRefreshRate] = useLocalStorage('stats-refreshRate', '5000');
    const t = useTranslations('docker.containerStats');
    const tStatus = useTranslations('docker.status');

    const container = useContainerStore((state) => state.container);
    const connectionState = useContainerStatsStore((state) => state.connectionState);
    const history = useContainerStatsStore((state) => state.history);
    const stats = useContainerStatsStore((state) => state.stats);
    const exportStats = useContainerStatsStore((state) => state.exportStats);

    const currentStatus = statusMap[connectionState];
    const isLoading = connectionState === 'connecting' || !stats;

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    useEffect(() => {
        if (!container) setOpen(false);
    }, [container]);

    const chartData = useMemo(
        () =>
            history.map((stat, index) => {
                const previous = index > 0 ? history[index - 1] : undefined;
                const elapsedSeconds = previous ? (stat.timestamp - previous.timestamp) / 1000 : 0;
                const toRate = (current: number, before: number) =>
                    elapsedSeconds > 0 ? Math.max(0, (current - before) / elapsedSeconds) : 0;

                return {
                    timestamp: stat.timestamp,
                    cpuPercent: stat.cpuPercent,
                    memoryUsage: stat.memoryUsage,
                    memoryPercent: stat.memoryPercent,
                    pidsCount: stat.pidsCount,
                    networkRxRate: previous ? toRate(stat.networkRx, previous.networkRx) : 0,
                    networkTxRate: previous ? toRate(stat.networkTx, previous.networkTx) : 0,
                    blockReadRate: previous ? toRate(stat.blockRead, previous.blockRead) : 0,
                    blockWriteRate: previous ? toRate(stat.blockWrite, previous.blockWrite) : 0,
                };
            }),
        [history],
    );

    const latest = chartData.length > 0 ? chartData[chartData.length - 1]! : null;

    const summaryCards = [
        {
            key: 'cpu',
            title: t('cpu'),
            icon: Cpu,
            value: formatPercent(stats?.cpuPercent ?? 0, 2),
            valueClassName: usageToneClass(stats?.cpuPercent ?? 0),
            description: t('cpuCores', { count: stats?.onlineCpus ?? 0 }),
            percent: stats?.cpuPercent ?? 0,
            sparklineValues: chartData.map((point) => point.cpuPercent),
        },
        {
            key: 'memory',
            title: t('memory'),
            icon: MemoryStick,
            value: formatBytes(stats?.memoryUsage ?? 0),
            valueClassName: usageToneClass(stats?.memoryPercent ?? 0),
            description: `${formatPercent(stats?.memoryPercent ?? 0)} · ${formatBytes(stats?.memoryLimit ?? 0)}`,
            percent: stats?.memoryPercent ?? 0,
            sparklineValues: chartData.map((point) => point.memoryUsage),
        },
        {
            key: 'network',
            title: t('network'),
            icon: Network,
            value: formatRate((latest?.networkRxRate ?? 0) + (latest?.networkTxRate ?? 0)),
            description: `↓ ${formatRate(latest?.networkRxRate ?? 0)} · ↑ ${formatRate(latest?.networkTxRate ?? 0)}`,
            sparklineValues: chartData.map((point) => point.networkRxRate + point.networkTxRate),
        },
        {
            key: 'block',
            title: t('blockIo'),
            icon: HardDrive,
            value: formatRate((latest?.blockReadRate ?? 0) + (latest?.blockWriteRate ?? 0)),
            description: `${t('read')} ${formatRate(latest?.blockReadRate ?? 0)} · ${t('write')} ${formatRate(latest?.blockWriteRate ?? 0)}`,
            sparklineValues: chartData.map((point) => point.blockReadRate + point.blockWriteRate),
        },
    ];

    const flushPanelClassName =
        'rounded-none border-0 border-b bg-transparent shadow-none lg:[&:nth-child(odd)]:border-r';

    const details = [
        { label: t('memoryLimit'), value: formatBytes(stats?.memoryLimit ?? 0) },
        { label: t('memoryPercent'), value: formatPercent(stats?.memoryPercent ?? 0, 2) },
        { label: t('memoryCache'), value: formatBytes(stats?.memoryCache ?? 0) },
        { label: t('onlineCpus'), value: `${stats?.onlineCpus ?? 0}` },
        { label: t('networkRxTotal'), value: formatBytes(stats?.networkRx ?? 0) },
        { label: t('networkTxTotal'), value: formatBytes(stats?.networkTx ?? 0) },
        { label: t('blockReadTotal'), value: formatBytes(stats?.blockRead ?? 0) },
        { label: t('blockWriteTotal'), value: formatBytes(stats?.blockWrite ?? 0) },
    ];

    return (
        <>
            {children({ openStats: handleOpen })}
            <Dialog open={open} modal onOpenChange={handleClose}>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    aria-describedby={undefined}
                    className="sm:max-w-5/6 gap-0 overflow-y-hidden overflow-x-visible p-0"
                >
                    <SSEProvider
                        connections={['stats']}
                        params={{ stats: { containerId: container?.id ?? '', refreshRate } }}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between border-b p-2 pl-3">
                            <div className="flex flex-row items-center gap-2">
                                <DialogTitle className="flex items-center gap-2 text-sm">
                                    <div className="flex size-4 items-center">
                                        <Activity />
                                    </div>
                                    {t('title', { name: container?.name ?? 'Unknown container' })}
                                    <Status className="rounded-none bg-transparent" status={currentStatus.status}>
                                        <StatusIndicator />
                                        <StatusLabel className={currentStatus.text}>
                                            {tStatus(currentStatus.labelKey)}
                                        </StatusLabel>
                                    </Status>
                                </DialogTitle>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <Select value={refreshRate} onValueChange={setRefreshRate}>
                                    <SelectTrigger className="h-7!">
                                        <SelectValue placeholder={t('refreshRatePlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent align="start">
                                        <SelectGroup>
                                            <SelectLabel>{t('refreshRate')}</SelectLabel>
                                            {refreshRateOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => exportStats(container?.name)}
                                    disabled={chartData.length === 0}
                                    className="h-7 text-xs"
                                    variant="white"
                                    icon={Download}
                                    size="sm"
                                >
                                    {t('download')}
                                </Button>
                                <Separator orientation="vertical" className="h-5!" />
                                <Button onClick={handleClose} className="h-7 text-xs" size="sm">
                                    {t('close')}
                                </Button>
                            </div>
                        </DialogHeader>

                        <ScrollAreaWithShadow bottomShadow className="h-150 overflow-y-auto">
                            <div className="bg-background pr-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                    {isLoading
                                        ? Array.from({ length: 4 }).map((_, index) => (
                                              <div
                                                  key={index}
                                                  className="flex flex-col gap-3 border-b p-5 md:not-nth-[2n]:border-r lg:not-last:border-r"
                                              >
                                                  <div className="flex items-start justify-between gap-2">
                                                      <Skeleton className="h-4 w-24" />
                                                      <Skeleton className="size-8 rounded-lg" />
                                                  </div>
                                                  <Skeleton className="h-8 w-32" />
                                                  <Skeleton className="h-3 w-28" />
                                                  <Skeleton className="h-1.5 w-full rounded-full" />
                                                  <Skeleton className="h-8 w-full" />
                                              </div>
                                          ))
                                        : summaryCards.map((card) => (
                                              <MetricCard
                                                  key={card.key}
                                                  title={card.title}
                                                  icon={card.icon}
                                                  value={card.value}
                                                  valueClassName={card.valueClassName}
                                                  description={card.description}
                                                  percent={card.percent}
                                                  sparklineValues={card.sparklineValues}
                                                  className="rounded-none border-0 border-b bg-transparent shadow-none md:not-nth-[2n]:border-r lg:not-last:border-r"
                                              />
                                          ))}
                                </div>

                                {isLoading ? (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-2">
                                            {Array.from({ length: 4 }).map((_, index) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-col gap-3 border-b p-4 lg:nth-[odd]:border-r"
                                                >
                                                    <Skeleton className="h-5 w-40" />
                                                    <Skeleton className="h-3 w-56" />
                                                    <Skeleton className="h-[200px] w-full" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3">
                                            <div className="flex flex-col gap-3 p-4 lg:col-span-2">
                                                <Skeleton className="h-5 w-40" />
                                                <Skeleton className="h-3 w-56" />
                                                <Skeleton className="h-[180px] w-full" />
                                            </div>
                                            <div className="bg-border grid grid-cols-1 gap-px border-t sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-t-0">
                                                {details.map((detail) => (
                                                    <div
                                                        key={detail.label}
                                                        className="bg-background flex items-center justify-between gap-2 px-4 py-2"
                                                    >
                                                        <Skeleton className="h-3 w-28" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-2">
                                            <MetricAreaChart
                                                title={t('cpuUsage')}
                                                description={t('cpuDescription')}
                                                data={chartData}
                                                series={[
                                                    {
                                                        dataKey: 'cpuPercent',
                                                        label: t('cpuPercent'),
                                                        color: MONITORING_CHART_COLORS[0]!,
                                                    },
                                                ]}
                                                formatValue={(value) => formatPercent(value, 2)}
                                                className={flushPanelClassName}
                                                chartClassName="h-[200px]"
                                                emptyLabel={t('waitingForData')}
                                            />
                                            <MetricAreaChart
                                                title={t('memoryUsage')}
                                                description={t('memoryDescription')}
                                                data={chartData}
                                                series={[
                                                    {
                                                        dataKey: 'memoryUsage',
                                                        label: t('memory'),
                                                        color: MONITORING_CHART_COLORS[1]!,
                                                    },
                                                ]}
                                                formatValue={(value) => formatBytes(value)}
                                                className={flushPanelClassName}
                                                chartClassName="h-[200px]"
                                                emptyLabel={t('waitingForData')}
                                            />
                                            <MetricAreaChart
                                                title={t('networkThroughput')}
                                                description={t('networkThroughputDescription')}
                                                data={chartData}
                                                series={[
                                                    {
                                                        dataKey: 'networkRxRate',
                                                        label: t('rx'),
                                                        color: MONITORING_CHART_COLORS[0]!,
                                                    },
                                                    {
                                                        dataKey: 'networkTxRate',
                                                        label: t('tx'),
                                                        color: MONITORING_CHART_COLORS[3]!,
                                                    },
                                                ]}
                                                formatValue={(value) => formatRate(value)}
                                                className={flushPanelClassName}
                                                chartClassName="h-[200px]"
                                                emptyLabel={t('waitingForData')}
                                            />
                                            <MetricAreaChart
                                                title={t('blockThroughput')}
                                                description={t('blockThroughputDescription')}
                                                data={chartData}
                                                series={[
                                                    {
                                                        dataKey: 'blockReadRate',
                                                        label: t('read'),
                                                        color: MONITORING_CHART_COLORS[2]!,
                                                    },
                                                    {
                                                        dataKey: 'blockWriteRate',
                                                        label: t('write'),
                                                        color: MONITORING_CHART_COLORS[4]!,
                                                    },
                                                ]}
                                                formatValue={(value) => formatRate(value)}
                                                className={flushPanelClassName}
                                                chartClassName="h-[200px]"
                                                emptyLabel={t('waitingForData')}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3">
                                            <MetricAreaChart
                                                title={t('pidsCount')}
                                                description={t('pidsDescription')}
                                                data={chartData}
                                                series={[
                                                    {
                                                        dataKey: 'pidsCount',
                                                        label: t('pidsCount'),
                                                        color: MONITORING_CHART_COLORS[2]!,
                                                    },
                                                ]}
                                                formatValue={(value) => `${Math.round(value)}`}
                                                className="rounded-none border-0 bg-transparent shadow-none lg:col-span-2"
                                                chartClassName="h-[180px]"
                                                emptyLabel={t('waitingForData')}
                                            />
                                            <div className="bg-border grid grid-cols-1 gap-px border-t sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-t-0">
                                                {details.map((detail) => (
                                                    <div
                                                        key={detail.label}
                                                        className="bg-background flex items-center justify-between gap-2 px-4 py-2"
                                                    >
                                                        <span className="text-muted-foreground truncate text-xs">
                                                            {detail.label}
                                                        </span>
                                                        <span className="truncate text-sm font-medium tabular-nums">
                                                            {detail.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </ScrollAreaWithShadow>
                    </SSEProvider>
                </DialogContent>
            </Dialog>
        </>
    );
}
