'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Container, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@workspace/ui/components/sheet';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { ContainerStatsSample } from '@workspace/typescript-interface/docker/docker.containers.stats';
import { ContainersStatsHistoryPoint } from '@workspace/typescript-interface/stores/docker/containersStatsStore';
import { containerDisplayState } from '@/utils/containerDisplayState';
import { formatBytes } from '@/utils/formatBytes';
import { MetricAreaChart } from '@/components/monitoring/MetricAreaChart';
import { formatPercent, formatRate, MONITORING_CHART_COLORS } from '@/components/monitoring/monitoringUtils';

interface ContainerMetricsSheetProps {
    container: ContainerStatsSample | null;
    history: ContainersStatsHistoryPoint[];
    onOpenChange: (open: boolean) => void;
}

export function ContainerMetricsSheet({ container, history, onOpenChange }: ContainerMetricsSheetProps) {
    const t = useTranslations('monitoring');
    const tDocker = useTranslations('docker');

    const chartData = useMemo(
        () =>
            history.map((point) => ({
                timestamp: point.timestamp,
                cpuPercent: point.cpuPercent,
                memoryUsage: point.memoryUsage,
                networkRxRate: point.networkRxRate,
                networkTxRate: point.networkTxRate,
                blockReadRate: point.blockReadRate,
                blockWriteRate: point.blockWriteRate,
            })),
        [history],
    );

    const imageHref = container?.imageId ? `/docker/images/${container.imageId}` : null;

    const details: { label: string; value: string; href?: string }[] = container
        ? [
              { label: t('table.cpu'), value: formatPercent(container.cpuPercent, 2) },
              {
                  label: t('table.memory'),
                  value: `${formatBytes(container.memoryUsage)} / ${formatBytes(container.memoryLimit)}`,
              },
              {
                  label: t('containers.memoryPercent'),
                  value: formatPercent(container.memoryPercent, 2),
              },
              { label: t('containers.networkRxTotal'), value: formatBytes(container.networkRx) },
              { label: t('containers.networkTxTotal'), value: formatBytes(container.networkTx) },
              { label: t('containers.blockReadTotal'), value: formatBytes(container.blockRead) },
              { label: t('containers.blockWriteTotal'), value: formatBytes(container.blockWrite) },
              { label: t('table.pids'), value: `${container.pidsCount}` },
              { label: t('containers.onlineCpus'), value: `${container.onlineCpus}` },
              { label: t('containers.image'), value: container.image, ...(imageHref ? { href: imageHref } : {}) },
          ]
        : [];

    const status = container ? containerDisplayState[container.state] : 'offline';

    const flushPanelClassName = 'rounded-none border-0 border-b bg-transparent shadow-none last:border-b-0';

    return (
        <Sheet open={Boolean(container)} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-3/5">
                {container ? (
                    <>
                        <SheetHeader className="flex flex-row items-start gap-3 border-b pr-12">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Container className="size-5 text-primary" />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <SheetTitle className="flex flex-wrap items-center gap-2">
                                    <span className="truncate">{container.name}</span>
                                    <Status status={status}>
                                        <StatusIndicator />
                                        <StatusLabel>{container.state}</StatusLabel>
                                    </Status>
                                    {container.stack ? <Badge variant="secondary">{container.stack}</Badge> : null}
                                </SheetTitle>
                                <SheetDescription className="truncate">
                                    {imageHref ? (
                                        <Link href={imageHref} className="hover:text-foreground hover:underline">
                                            {container.image}
                                        </Link>
                                    ) : (
                                        container.image
                                    )}
                                </SheetDescription>
                            </div>
                            <Button asChild size="sm" variant="outline" className="shrink-0">
                                <Link href={`/docker/containers/${container.containerId}`}>
                                    <ExternalLink />
                                    {t('containers.openContainer')}
                                </Link>
                            </Button>
                        </SheetHeader>

                        <ScrollAreaWithShadow bottomShadow className="h-full overflow-hidden">
                            <div className="bg-background pr-1">
                                <div className="grid grid-cols-2 gap-px border-b bg-border">
                                    {details.map((detail) =>
                                        detail.href ? (
                                            <Link
                                                key={detail.label}
                                                href={detail.href}
                                                className="block bg-background px-4 py-2 transition-colors hover:bg-muted/40"
                                            >
                                                <p className="text-muted-foreground text-xs">{detail.label}</p>
                                                <p
                                                    className="truncate font-medium text-sm tabular-nums underline-offset-2 hover:underline"
                                                    title={detail.value}
                                                >
                                                    {detail.value}
                                                </p>
                                            </Link>
                                        ) : (
                                            <div key={detail.label} className="bg-background px-4 py-2">
                                                <p className="text-muted-foreground text-xs">{detail.label}</p>
                                                <p
                                                    className="truncate font-medium text-sm tabular-nums"
                                                    title={detail.value}
                                                >
                                                    {detail.value}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </div>

                                <MetricAreaChart
                                    title={t('containers.cpuChartTitle')}
                                    data={chartData}
                                    series={[
                                        {
                                            dataKey: 'cpuPercent',
                                            label: t('table.cpu'),
                                            color: MONITORING_CHART_COLORS[0]!,
                                        },
                                    ]}
                                    formatValue={(value) => formatPercent(value, 2)}
                                    className={flushPanelClassName}
                                    emptyLabel={t('waitingForData')}
                                />
                                <MetricAreaChart
                                    title={t('containers.memoryChartTitle')}
                                    data={chartData}
                                    series={[
                                        {
                                            dataKey: 'memoryUsage',
                                            label: t('table.memory'),
                                            color: MONITORING_CHART_COLORS[1]!,
                                        },
                                    ]}
                                    formatValue={(value) => formatBytes(value)}
                                    className={flushPanelClassName}
                                    emptyLabel={t('waitingForData')}
                                />
                                <MetricAreaChart
                                    title={t('containers.networkChartTitle')}
                                    data={chartData}
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
                                    className={flushPanelClassName}
                                    emptyLabel={t('waitingForData')}
                                />
                                <MetricAreaChart
                                    title={t('containers.blockChartTitle')}
                                    data={chartData}
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
                                    className={flushPanelClassName}
                                    emptyLabel={t('waitingForData')}
                                />
                            </div>
                        </ScrollAreaWithShadow>
                    </>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
