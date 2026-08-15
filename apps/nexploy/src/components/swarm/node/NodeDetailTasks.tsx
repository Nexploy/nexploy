'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SwarmTask, SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useSwarmNodeStore } from '@/stores/docker/useSwarmNodeStore.ts';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';
import { useRouter } from 'next/navigation';
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

export function NodeDetailTasks() {
    const t = useTranslations('swarm');
    const router = useRouter();

    const tasks = useSwarmNodeStore((s) => s.tasks);
    const isConnecting = useSwarmNodeStore((s) => s.isConnecting);

    const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);

    const columns = useMemo<ColumnDef<SwarmTask>[]>(
        () => [
            {
                id: 'slot',
                size: 80,
                accessorFn: (row) => row.slot ?? row.id,
                header: () => t('detail.taskSlot'),
                cell: ({ row }) => (
                    <span className="font-mono text-xs">
                        {row.original.slot !== undefined ? `#${row.original.slot}` : row.original.id.slice(0, 12)}
                    </span>
                ),
            },
            {
                id: 'serviceName',
                accessorKey: 'serviceName',
                header: () => t('service'),
                cell: ({ getValue }) => <span className="font-medium text-sm">{getValue<string>()}</span>,
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
            {
                id: 'updatedAt',
                accessorKey: 'updatedAt',
                enableHiding: true,
            },
        ],
        [t],
    );

    const table = useReactTable({
        data: tasks ?? [],
        columns,
        state: { sorting, columnVisibility: { updatedAt: false } },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (!tasks || isConnecting) {
        return <Skeleton className={'h-80 flex-1'} />;
    }

    return (
        <Card>
            <CardHeaderWithIcon icon={Activity} title={t('node.tasksTitle')} />
            <CardContent className={'p-0'}>
                {table.getRowModel().rows.length === 0 ? (
                    <div className="flex h-32 items-center justify-center pb-12 font-semibold text-muted-foreground text-sm">
                        {t('node.noTasks')}
                    </div>
                ) : (
                    <TableShell
                        bare
                        table={table}
                        rowClassName="h-11"
                        emptyLabel={t('node.noTasks')}
                        isRowClickable={(task) => !!task.containerStatus?.containerId && task.state === 'running'}
                        onRowClick={(task) => router.push(`/docker/containers/${task.containerStatus?.containerId}`)}
                    />
                )}
            </CardContent>
        </Card>
    );
}
