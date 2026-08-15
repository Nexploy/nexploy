'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import type { SwarmTask, SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useSwarmServiceStore } from '@/stores/docker/useSwarmServiceStore.ts';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';
import { ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { TableShell } from '@/components/table/TableShell';

function taskStateToStatus(state: SwarmTaskState): 'online' | 'offline' | 'maintenance' | 'degraded' | 'waiting' {
    switch (state) {
        case 'running':
            return 'online';
        case 'failed':
        case 'rejected':
        case 'orphaned':
            return 'offline';
        case 'complete':
        case 'shutdown':
            return 'maintenance';
        case 'remove':
            return 'degraded';
        default:
            return 'waiting';
    }
}

export function ServiceDetailTasks() {
    const t = useTranslations('swarm');

    const tasks = useSwarmServiceStore((s) => s.tasks);
    const isConnecting = useSwarmServiceStore((s) => s.isConnecting);

    const [sorting, setSorting] = useState<SortingState>([{ id: 'slot', desc: false }]);

    const columns = useMemo<ColumnDef<SwarmTask>[]>(
        () => [
            {
                id: 'slot',
                size: 80,
                accessorFn: (row) => row.slot ?? 0,
                header: () => t('detail.taskSlot'),
                cell: ({ row }) => (
                    <span className="font-mono text-xs">
                        {row.original.slot !== undefined ? `#${row.original.slot}` : row.original.id.slice(0, 12)}
                    </span>
                ),
            },
            {
                id: 'state',
                accessorKey: 'state',
                header: () => t('detail.taskState'),
                cell: ({ getValue }) => {
                    const state = getValue<SwarmTaskState>();
                    return (
                        <Status className="border-0 text-sm" status={taskStateToStatus(state)} variant="outline">
                            <StatusIndicator />
                            <StatusLabel className="text-sm capitalize">{state}</StatusLabel>
                        </Status>
                    );
                },
            },
            {
                id: 'desiredState',
                accessorKey: 'desiredState',
                header: () => t('detail.taskDesiredState'),
                cell: ({ getValue }) => (
                    <Badge variant="outline" className="text-xs capitalize">
                        {getValue<string>()}
                    </Badge>
                ),
            },
            {
                id: 'node',
                accessorKey: 'nodeHostname',
                header: () => t('detail.taskNode'),
                cell: ({ getValue }) => <span className="text-sm">{getValue<string | undefined>() ?? '—'}</span>,
            },
            {
                id: 'container',
                accessorFn: (row) => row.containerStatus?.containerId,
                header: () => t('detail.taskContainer'),
                cell: ({ getValue }) => {
                    const containerId = getValue<string | undefined>();
                    return <span className="font-mono text-xs">{containerId ? containerId.slice(0, 12) : '—'}</span>;
                },
            },
            {
                id: 'error',
                accessorKey: 'error',
                header: () => t('detail.taskError'),
                cell: ({ getValue }) => (
                    <span className="max-w-[200px] truncate text-red-500 text-xs">
                        {getValue<string | undefined>() ?? '—'}
                    </span>
                ),
            },
        ],
        [t],
    );

    const table = useReactTable({
        data: tasks,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (isConnecting) {
        return <Skeleton className={'h-80 flex-1'} />;
    }

    return (
        <Card>
            <CardHeaderWithIcon icon={Activity} title={t('detail.tasksTitle')} />
            <CardContent className="p-0">
                {table.getRowModel().rows.length === 0 ? (
                    <div className="flex h-32 items-center justify-center pb-12 font-semibold text-muted-foreground text-sm">
                        {t('detail.noTasks')}
                    </div>
                ) : (
                    <TableShell bare table={table} rowClassName="h-11" emptyLabel={t('detail.noTasks')} />
                )}
            </CardContent>
        </Card>
    );
}
