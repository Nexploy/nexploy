'use client';

import {
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    RowSelectionState,
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
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
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
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { getColumnsSwarmServices } from './ColumnsSwarmServices';
import { ServiceTableActions } from './ServiceTableActions';

const globalFilterFn: FilterFn<SwarmService> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, image, mode } = row.original;
    return (
        name.toLowerCase().includes(search) ||
        image.toLowerCase().includes(search) ||
        mode.toLowerCase().includes(search)
    );
};

export function ServicesTable() {
    const services = useSwarmStore((state) => state.services);
    const lastUpdate = useSwarmStore((state) => state.lastUpdate);

    const getTasksByService = useSwarmStore((state) => state.getTasksByService);

    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const getRunningTasksCount = useMemo(
        () => (serviceId: string) =>
            getTasksByService(serviceId).filter((task) => task.state === 'running').length,
        [getTasksByService],
    );

    const table = useReactTable({
        data: services,
        columns: getColumnsSwarmServices(t, getRunningTasksCount),
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: PAGE_SIZE_DEFAULT } },
        state: { sorting, globalFilter, rowSelection },
    });

    const selectedIds = Object.keys(rowSelection);
    const selectedServices = services.filter((s) => selectedIds.includes(s.id));

    const isLoading = services.length === 0 && !lastUpdate;
    const isEmpty = services.length === 0 && !!lastUpdate;
    const isShowingAll = pageSize === 'all';
    const noMatch = !isEmpty && services.length > 0 && table.getRowModel().rows.length === 0;

    if (isEmpty) {
        return (
            <div className="px-5">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-primary/10">
                            <Layers className="text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>{t('noServicesFound')}</EmptyTitle>
                        <EmptyDescription>{t('noServicesDescription')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        );
    }

    return (
        <div className="mx-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Input
                    className="w-56 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <ServiceTableActions
                    selectedServices={selectedServices}
                    onResetSelection={() => table.resetRowSelection()}
                />
            </div>

            <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
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
                                    {table.getAllColumns().map((_, ci) => (
                                        <TableCell key={ci}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}

                        {noMatch && (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="py-6 text-center"
                                >
                                    {tCommon('noMatchSearch')}
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading &&
                            !noMatch &&
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="h-12" data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{t('servicesPerPage')}:</span>
                    <Select
                        value={pageSize === 'all' ? 'all' : `${pageSize}`}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(services.length || 1);
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
