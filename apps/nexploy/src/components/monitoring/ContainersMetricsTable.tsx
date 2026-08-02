'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    ColumnFiltersState,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContainerStatsSample } from '@workspace/typescript-interface/docker/docker.containers.stats';
import { ContainersStatsHistoryPoint } from '@workspace/typescript-interface/stores/docker/containersStatsStore';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { getColumnsContainersMetrics } from '@/components/monitoring/ColumnsContainersMetrics';

interface ContainersMetricsTableProps {
    stats: ContainerStatsSample[];
    history: Record<string, ContainersStatsHistoryPoint[]>;
    onSelect: (container: ContainerStatsSample) => void;
}

const globalFilterFn: FilterFn<ContainerStatsSample> = (row, _, value) => {
    const search = String(value).toLowerCase();
    const { name, image, stack } = row.original;

    return (
        name.toLowerCase().includes(search) ||
        image.toLowerCase().includes(search) ||
        (stack ?? '').toLowerCase().includes(search)
    );
};

export function ContainersMetricsTable({ stats, history, onSelect }: ContainersMetricsTableProps) {
    const t = useTranslations('monitoring');
    const tCommon = useTranslations('common');

    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const columns = useMemo(() => getColumnsContainersMetrics(t, history), [t, history]);

    const table = useReactTable({
        data: stats,
        columns,
        getRowId: (container) => container.containerId,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        globalFilterFn,
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? stats.length : pageSize,
            },
        },
        state: {
            sorting,
            globalFilter,
            columnFilters,
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

    return (
        <div className="space-y-3">
            <Input
                className="shadow-xs w-1/3"
                placeholder={t('table.searchPlaceholder')}
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
            />

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
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="text-muted-foreground h-24 text-center"
                                >
                                    {t('table.noContainers')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
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

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{t('table.perPage')}:</span>
                    <Select
                        value={pageSize === 'all' ? 'all' : `${pageSize}`}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(Math.max(1, stats.length));
                            } else {
                                const size = Number(value);
                                setPageSize(size);
                                table.setPageSize(size);
                            }
                        }}
                    >
                        <SelectTrigger size="sm" className="w-24">
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
                                current: pageIndex + 1,
                                total: Math.max(1, pageCount),
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
