'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Button } from '@workspace/ui/components/button';
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
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { activityMatchesSearch } from '@/lib/activity/activityFilters';
import { getColumnsActivity } from '@/components/admin/activity/ColumnsActivity';

interface ActivityTableProps {
    entries: ActivityLogEntry[];
    search: string;
    isLoading: boolean;
    emptyLabel: string;
    noResultsLabel: string;
    onSelect: (entry: ActivityLogEntry) => void;
}

const DEFAULT_SORTING: SortingState = [{ id: 'date', desc: true }];

const globalFilterFn: FilterFn<ActivityLogEntry> = (row, _columnId, value) =>
    activityMatchesSearch(row.original, String(value));

export function ActivityTable({
    entries,
    search,
    isLoading,
    emptyLabel,
    noResultsLabel,
    onSelect,
}: ActivityTableProps) {
    const t = useTranslations('admin.activity');
    const tCommon = useTranslations('common');

    const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const columns = useMemo(() => getColumnsActivity(t), [t]);

    const table = useReactTable({
        data: entries,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false,
        onSortingChange: setSorting,
        globalFilterFn,
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? entries.length : pageSize,
            },
        },
        state: {
            sorting,
            globalFilter: search,
        },
    });

    const pageCount = table.getPageCount();
    const pageIndex = table.getState().pagination.pageIndex;

    useEffect(() => {
        if (pageIndex > 0 && pageIndex >= pageCount) {
            table.setPageIndex(Math.max(0, pageCount - 1));
        }
    }, [table, pageIndex, pageCount]);

    const isShowingAll = pageSize === 'all';
    const rows = table.getRowModel().rows;
    const filteredCount = table.getFilteredRowModel().rows.length;

    return (
        <div className="space-y-3">
            <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading &&
                            Array.from({ length: 10 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="h-12">
                                    {table.getAllColumns().map((column) => (
                                        <TableCell key={column.id}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}

                        {!isLoading && rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={table.getAllColumns().length} className="py-6 text-center">
                                    {entries.length === 0 ? emptyLabel : noResultsLabel}
                                </TableCell>
                            </TableRow>
                        ) : (
                            !isLoading &&
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="h-12 cursor-pointer"
                                    onClick={() => onSelect(row.original)}
                                >
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

            {!isLoading && entries.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">{tCommon('perPage')}:</span>
                        <Select
                            value={pageSize === 'all' ? 'all' : `${pageSize}`}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    setPageSize('all');
                                    table.setPageSize(Math.max(1, entries.length));
                                } else {
                                    const size = Number(value);
                                    setPageSize(size);
                                    table.setPageSize(size);
                                }
                            }}
                        >
                            <SelectTrigger size="sm" className="min-w-24">
                                <SelectValue placeholder={tCommon('perPage')} />
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

                        <span className="text-muted-foreground text-sm">{t('total', { count: filteredCount })}</span>
                    </div>

                    {!isShowingAll && (
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">
                                {tCommon('pageOf', {
                                    current: pageIndex + 1,
                                    total: Math.max(1, pageCount),
                                })}
                            </span>
                            <div className="flex gap-2">
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
            )}
        </div>
    );
}
