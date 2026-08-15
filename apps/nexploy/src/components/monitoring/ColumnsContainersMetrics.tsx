'use client';

import { Column, ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { ContainerStatsSample } from '@workspace/typescript-interface/docker/docker.containers.stats';
import { ContainersStatsHistoryPoint } from '@workspace/typescript-interface/stores/docker/containersStatsStore';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import { containerDisplayState } from '@/utils/containerDisplayState';
import { formatBytes } from '@/utils/formatBytes';
import { Sparkline } from '@/components/monitoring/Sparkline';
import { formatPercent, formatRate, usageToneClass } from '@/components/monitoring/monitoringUtils';

export function getColumnsContainersMetrics(
    t: TranslationFunction,
    history: Record<string, ContainersStatsHistoryPoint[]>,
): ColumnDef<ContainerStatsSample>[] {
    const sortableHeader =
        (label: string, align: 'left' | 'right' = 'left') =>
        ({ column }: { column: Column<ContainerStatsSample, unknown> }) => (
            <Button
                variant="ghost"
                size="sm"
                className={cn('h-7 px-2', align === 'right' && 'ml-auto flex')}
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {label}
                <ArrowUpDown />
            </Button>
        );

    return [
        {
            accessorKey: 'name',
            header: sortableHeader(t('table.container')),
            cell: ({ row }) => (
                <div className="flex max-w-64 flex-col gap-0.5">
                    <Status
                        className="w-fit border-0 bg-transparent px-0 pl-1 text-sm"
                        status={containerDisplayState[row.original.state] ?? 'offline'}
                        variant="outline"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <StatusIndicator />
                            </TooltipTrigger>
                            <TooltipContent>{row.original.state}</TooltipContent>
                        </Tooltip>
                        <StatusLabel className="truncate font-medium text-current">{row.original.name}</StatusLabel>
                    </Status>
                    <span className="truncate text-muted-foreground text-xs">
                        {row.original.stack ? `${row.original.stack} • ${row.original.image}` : row.original.image}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'cpuPercent',
            header: sortableHeader(t('table.cpu'), 'right'),
            cell: ({ row }) => (
                <div className="flex flex-col items-end gap-1">
                    <span className={cn('tabular-nums', usageToneClass(row.original.cpuPercent))}>
                        {formatPercent(row.original.cpuPercent, 2)}
                    </span>
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-primary/15">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, row.original.cpuPercent)}%` }}
                        />
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'memoryUsage',
            header: sortableHeader(t('table.memory'), 'right'),
            cell: ({ row }) => (
                <div className="flex flex-col items-end gap-0.5">
                    <span className="tabular-nums">{formatBytes(row.original.memoryUsage)}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                        {formatPercent(row.original.memoryPercent)} · {formatBytes(row.original.memoryLimit)}
                    </span>
                </div>
            ),
        },
        {
            id: 'network',
            accessorFn: (container) => container.networkRxRate + container.networkTxRate,
            header: sortableHeader(t('table.network'), 'right'),
            cell: ({ row }) => (
                <div className="flex flex-col items-end gap-0.5 text-xs tabular-nums">
                    <span>↓ {formatRate(row.original.networkRxRate)}</span>
                    <span className="text-muted-foreground">↑ {formatRate(row.original.networkTxRate)}</span>
                </div>
            ),
        },
        {
            id: 'block',
            accessorFn: (container) => container.blockReadRate + container.blockWriteRate,
            header: sortableHeader(t('table.blockIo'), 'right'),
            cell: ({ row }) => (
                <div className="flex flex-col items-end gap-0.5 text-xs tabular-nums">
                    <span>
                        {t('table.blockRead')} {formatRate(row.original.blockReadRate)}
                    </span>
                    <span className="text-muted-foreground">
                        {t('table.blockWrite')} {formatRate(row.original.blockWriteRate)}
                    </span>
                </div>
            ),
        },
        {
            id: 'trend',
            header: () => <div className="text-right">{t('table.trend')}</div>,
            enableSorting: false,
            cell: ({ row }) => (
                <Sparkline
                    values={(history[row.original.containerId] ?? []).map((point) => point.cpuPercent)}
                    className="h-8 w-24"
                />
            ),
        },
    ];
}
