'use client';

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
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
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
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
import { useRequestsStore } from '@/stores/traefik/useRequestsStore';
import { getColumnsTableRequests } from '@/components/traefik/table/ColumnsRequests';

export function TableRequests() {
    const t = useTranslations('requests');
    const tCommon = useTranslations('common');

    const {
        filteredRequests,
        requests,
        lastUpdate,
        searchQuery,
        methodFilter,
        statusFilter,
        setSearchQuery,
        setMethodFilter,
        setStatusFilter,
    } = useRequestsStore();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const columns = useMemo(() => getColumnsTableRequests(t), [t]);

    const isLoading = !lastUpdate;
    const isEmpty = requests.length === 0;

    const table = useReactTable({
        data: filteredRequests,
        columns,
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? filteredRequests.length || 1 : pageSize,
            },
        },
        state: {
            sorting,
        },
    });

    const isShowingAll = pageSize === 'all';

    return (
        <div className="mx-5 space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
                <Input
                    className="w-56 shadow-xs"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-2">
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                        <SelectTrigger className={'w-40'}>
                            <SelectValue placeholder={t('method')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('method')}</SelectLabel>
                                <SelectItem value="all">{t('allMethods')}</SelectItem>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className={'w-40'}>
                            <SelectValue placeholder={t('status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('status')}</SelectLabel>
                                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                                <SelectItem value="2xx">{t('success2xx')}</SelectItem>
                                <SelectItem value="3xx">{t('redirect3xx')}</SelectItem>
                                <SelectItem value="4xx">{t('clientError4xx')}</SelectItem>
                                <SelectItem value="5xx">{t('serverError5xx')}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
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
                            Array.from({ length: 10 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="h-12">
                                    {columns.map((_, index) => (
                                        <TableCell key={index}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}

                        {!isLoading && table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-6 text-center">
                                    <span className="text-muted-foreground text-sm">
                                        {isEmpty ? t('noRequests') : t('noMatchingRequests')}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ) : (
                            !isLoading &&
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

            {!isLoading && !!filteredRequests.length && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                            {t('requestsPerPage')}
                        </span>
                        <Select
                            value={pageSize === 'all' ? 'all' : `${pageSize}`}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    setPageSize('all');
                                    table.setPageSize(filteredRequests.length || 1);
                                } else {
                                    const size = Number(value);
                                    setPageSize(size);
                                    table.setPageSize(size);
                                }
                            }}
                        >
                            <SelectTrigger size="sm" className="min-w-24">
                                <SelectValue placeholder={t('perPage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{tCommon('size')}</SelectLabel>
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <SelectItem key={size} value={`${size}`}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="all">{t('all')}</SelectItem>
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
            )}
        </div>
    );
}
