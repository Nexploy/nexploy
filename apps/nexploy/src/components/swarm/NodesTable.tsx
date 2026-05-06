'use client';

import {
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import React, { useMemo, useState } from 'react';
import { getColumnsTableNodes } from './ColumnsDockerNodes';
import { useTranslations } from 'next-intl';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import type { SwarmNode } from '@workspace/typescript-interface/docker/swarm';
import { Server } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';

const globalFilterFn: FilterFn<SwarmNode> = (row, _, value) => {
    const search = value.toLowerCase();
    const { hostname, role, state, availability, address, engineVersion } = row.original;
    return (
        hostname.toLowerCase().includes(search) ||
        role.toLowerCase().includes(search) ||
        state.toLowerCase().includes(search) ||
        availability.toLowerCase().includes(search) ||
        (address || '').toLowerCase().includes(search) ||
        (engineVersion || '').toLowerCase().includes(search)
    );
};

export function NodesTable() {
    const [sorting, setSorting] = useState<SortingState>([]);

    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const nodes = useSwarmStore((state) => state.nodes);
    const isSwarmActive = useSwarmStore((state) => state.isSwarmActive);
    const lastUpdate = useSwarmStore((state) => state.lastUpdate);

    const columns = useMemo(() => getColumnsTableNodes(t), [t]);

    const table = useReactTable({
        data: nodes,
        columns,
        getRowId: (row: SwarmNode) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
        },
    });

    if (!isSwarmActive) return null;

    const isLoading = !nodes.length && !lastUpdate;
    const isEmpty = !nodes.length && !!lastUpdate;

    if (isEmpty) {
        return (
            <div className="px-5">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-primary/10">
                            <Server className="text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>{t('noNodesFound')}</EmptyTitle>
                        <EmptyDescription>{t('noNodesDescription')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        );
    }

    return (
        <div className="bg-card mx-5 rounded-md border shadow-sm">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading &&
                        Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i} className="h-12">
                                {table.getAllColumns().map((column) => (
                                    <TableCell key={column.id}>
                                        <Skeleton className="h-6 w-full" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}

                    {!isLoading && table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={table.getAllColumns().length}
                                className="py-6 text-center"
                            >
                                {tCommon('noMatchSearch')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className="h-12">
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
