'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ChevronRight, Layers, MoreVertical } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { ContainerTableRow } from './containerTableUtils';
import { StackActionsCell } from './StackActionsCell';
import { ContainersDropdownActions } from './ContainersDropdownActions';
import { containerDisplayState } from '@/utils/containerDisplayState';

type TranslationFunction = (key: string) => string;

export function getColumnsDockerContainers(
    t: TranslationFunction,
    tCommon: TranslationFunction,
): ColumnDef<ContainerTableRow>[] {
    return [
        {
            id: 'select',
            size: 28,
            header: ({ table }) => {
                const allRows = table.getRowModel().flatRows;
                const selectableRows = allRows.filter((row) => !row.original.isGroup);
                const allSelected =
                    selectableRows.length > 0 && selectableRows.every((row) => row.getIsSelected());
                const someSelected = selectableRows.some((row) => row.getIsSelected());
                return (
                    <Checkbox
                        checked={allSelected || (someSelected && 'indeterminate')}
                        onCheckedChange={(value) => {
                            selectableRows.forEach((row) => row.toggleSelected(!!value));
                        }}
                        aria-label="Select all"
                    />
                );
            },
            cell: ({ row }) => {
                if (row.original.isGroup) {
                    const isAllSelected = row.getIsAllSubRowsSelected();
                    const isSomeSelected = row.getIsSomeSelected() && !isAllSelected;
                    return (
                        <Checkbox
                            checked={isSomeSelected ? 'indeterminate' : isAllSelected}
                            onCheckedChange={(value) => {
                                row.subRows.forEach((subRow) => subRow.toggleSelected(!!value));
                            }}
                            aria-label="Select group"
                        />
                    );
                }
                return (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                );
            },
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('name')}
                    <ArrowUpDown />
                </Button>
            ),
            cell: ({ row }) => {
                if (row.original.isGroup) {
                    return (
                        <div className="flex min-w-0 items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0"
                                onClick={() => row.toggleExpanded()}
                            >
                                <ChevronRight
                                    className={cn(
                                        'size-4 transition-transform duration-200',
                                        row.getIsExpanded() && 'rotate-90',
                                    )}
                                />
                            </Button>
                            <div className="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-md">
                                <Layers className="text-primary size-4" />
                            </div>
                            <span className="min-w-0 flex-1 truncate">
                                {row.original.stackName}
                            </span>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                                {row.original.runningCount}/{row.original.totalCount}
                            </Badge>
                        </div>
                    );
                }
                return (
                    <Link
                        href={`/docker/containers/${row.original.id}`}
                        className="flex hover:underline"
                    >
                        <span className="truncate">{row.original.name}</span>
                    </Link>
                );
            },
        },
        {
            accessorKey: 'state',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('containerStatus')}
                    <ArrowUpDown />
                </Button>
            ),
            cell: ({ row }) => {
                if (row.original.isGroup) {
                    const allRunning = row.original.runningCount === row.original.totalCount;
                    return (
                        <Status
                            className="max-w-full justify-start overflow-hidden border-0 text-sm"
                            status={allRunning ? 'online' : 'offline'}
                            variant="outline"
                        >
                            <StatusIndicator />
                            <StatusLabel className="min-w-0 truncate text-sm">
                                {allRunning ? tCommon('up') : tCommon('down')}
                            </StatusLabel>
                        </Status>
                    );
                }
                return (
                    <Status
                        className={'max-w-full justify-start border-0 text-sm'}
                        status={containerDisplayState[row.original.state!] ?? 'offline'}
                        variant="outline"
                    >
                        <StatusIndicator />
                        <StatusLabel className={'min-w-0 truncate text-sm'}>
                            {row.original.status}
                        </StatusLabel>
                    </Status>
                );
            },
        },
        {
            accessorKey: 'image',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('containerImage')}
                    <ArrowUpDown />
                </Button>
            ),
            cell: ({ row }) => {
                if (row.original.isGroup) {
                    return <span className="text-muted-foreground text-sm">—</span>;
                }
                return (
                    <Badge variant={'secondary'} className={'max-w-full justify-start'}>
                        <span className={'truncate'}>{row.original.image}</span>
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'ports',
            enableSorting: false,
            header: t('containerPorts'),
            cell: ({ row }) => {
                if (row.original.isGroup) {
                    return <span className="text-muted-foreground text-sm">—</span>;
                }
                const ports = row.original.ports ?? [];
                if (!ports.length) {
                    return <span className="text-muted-foreground text-sm">—</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1 truncate">
                        {ports.slice(0, 2).map((p, i) => (
                            <Badge
                                key={i}
                                variant={'secondary'}
                                className={'max-w-full justify-start'}
                            >
                                <span className={'truncate'}>
                                    {p.publicPort} → {p.privatePort}/{p.type}
                                </span>
                            </Badge>
                        ))}
                        {ports.length > 2 && (
                            <Badge
                                variant="secondary"
                                className={'max-w-full justify-start text-xs'}
                            >
                                <span className={'truncate'}>+{ports.length - 2}</span>
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            size: 160,
            cell: ({ row }) => {
                if (row.original.isGroup) {
                    return (
                        <StackActionsCell
                            stackName={row.original.stackName!}
                            runningCount={row.original.runningCount ?? 0}
                            totalCount={row.original.totalCount ?? 0}
                        />
                    );
                }
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical />
                                </Button>
                            </DropdownMenuTrigger>
                            <ContainersDropdownActions container={row.original} />
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}
