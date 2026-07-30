'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    flexRender,
    getCoreRowModel,
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DockerEventData } from '@workspace/typescript-interface/docker/docker.events';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { getColumnsDockerEvents } from '@/components/docker/events/ColumnsDockerEvents';

interface TableDockerEventsProps {
    events: DockerEventData[];
    isLoading: boolean;
    emptyLabel: string;
}

export function TableDockerEvents({ events, isLoading, emptyLabel }: TableDockerEventsProps) {
    const t = useTranslations('docker');
    const tCommon = useTranslations('common');

    const [sorting, setSorting] = useState<SortingState>([]);
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const columns = useMemo(() => getColumnsDockerEvents(t), [t]);

    const table = useReactTable({
        data: events,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false,
        onSortingChange: setSorting,
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? events.length : pageSize,
            },
        },
        state: {
            sorting,
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
            <div className="bg-card mx-5 overflow-hidden rounded-md border shadow-sm">
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
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="py-6 text-center"
                                >
                                    {emptyLabel}
                                </TableCell>
                            </TableRow>
                        ) : (
                            !isLoading &&
                            rows.map((row) => (
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

            {!isLoading && events.length > 0 && (
                <div className="mx-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">{t('eventsPerPage')}:</span>
                        <Select
                            value={pageSize === 'all' ? 'all' : `${pageSize}`}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    setPageSize('all');
                                    table.setPageSize(Math.max(1, events.length));
                                } else {
                                    const size = Number(value);
                                    setPageSize(size);
                                    table.setPageSize(size);
                                }
                            }}
                        >
                            <SelectTrigger size="sm" className="min-w-24">
                                <SelectValue placeholder={t('eventsPerPage')} />
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
