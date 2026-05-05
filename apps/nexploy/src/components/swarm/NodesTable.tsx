'use client';

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import {
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
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
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, Server } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
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
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

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
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? nodes.length : pageSize,
            },
        },
        state: {
            sorting,
            globalFilter,
        },
    });

    if (!isSwarmActive) return null;

    const isLoading = !nodes.length && !lastUpdate;
    const isEmpty = !nodes.length && !!lastUpdate;
    const isShowingAll = pageSize === 'all';

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
        <div className="mx-5 space-y-3">
            <div className="flex justify-between">
                <Input
                    className="w-1/5 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>
            <div className="bg-card overflow-hidden rounded-md border shadow-sm">
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
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{t('nodesPerPage')}:</span>
                    <Select
                        value={pageSize === 'all' ? 'all' : String(pageSize)}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(nodes.length);
                            } else {
                                const size = Number(value);
                                setPageSize(size);
                                table.setPageSize(size);
                            }
                        }}
                    >
                        <SelectTrigger size="sm" className="min-w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{tCommon('size')}</SelectLabel>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                                <SelectItem value="all">{tCommon('all')}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {!isShowingAll && (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                            {tCommon('pageOf', {
                                current: table.getState().pagination.pageIndex + 1,
                                total: table.getPageCount(),
                            })}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                {tCommon('previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                {tCommon('next')}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
