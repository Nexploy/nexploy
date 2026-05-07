'use client';

import {
    ExpandedState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
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
import { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { cn } from '@workspace/ui/lib/utils';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import {
    buildContainerRows,
    containerTableGlobalFilterFn,
    ContainerTableRow,
} from './containerTableUtils';
import { getColumnsDockerContainers } from './ColumnsDockerContainers';
import { ContainerTableActions } from './ContainerTableActions';

interface TableDockerContainersProps {
    containers: Containers[];
    isLoading: boolean;
}

function getSelectedContainers(
    rows: ContainerTableRow[],
    selectedIds: string[],
): ContainerTableRow[] {
    return rows
        .flatMap((r) => (r.isGroup ? (r.subRows ?? []) : [r]))
        .filter((r) => selectedIds.includes(r.id));
}

export function TableDockerContainers({ containers, isLoading }: TableDockerContainersProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const t = useTranslations('docker.tables');
    const tCommon = useTranslations('common');

    const containerRows = useMemo(() => buildContainerRows(containers), [containers]);
    const columns = useMemo(() => getColumnsDockerContainers(t, tCommon), [t, tCommon]);

    const table = useReactTable({
        data: containerRows,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onExpandedChange: setExpanded,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: containerTableGlobalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowId: (row) => row.id,
        getSubRows: (row) => row.subRows,
        initialState: { pagination: { pageSize: PAGE_SIZE_DEFAULT } },
        state: { sorting, globalFilter, expanded, rowSelection },
    });

    const selectedIds = Object.keys(rowSelection);
    const selectedContainers = useMemo(
        () => getSelectedContainers(containerRows, selectedIds),
        [containerRows, selectedIds],
    );

    const isShowingAll = pageSize === 'all';
    const isEmpty = !isLoading && containerRows.length === 0;
    const noMatch = !isLoading && containerRows.length > 0 && table.getRowModel().rows.length === 0;

    return (
        <div className="mx-5 space-y-3">
            <div className="flex items-center justify-between gap-3 pt-1">
                <Input
                    className="w-1/5 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <ContainerTableActions
                    selectedContainers={selectedContainers}
                    onResetSelection={() => table.resetRowSelection()}
                />
            </div>

            <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                <Table className={'table-fixed'}>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="overflow-hidden"
                                        style={
                                            header.column.getSize() !== 150
                                                ? { width: header.column.getSize() }
                                                : undefined
                                        }
                                    >
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
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="h-12">
                                    {columns.map((_, ci) => (
                                        <TableCell key={ci}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}

                        {isEmpty && (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-6 text-center">
                                    {t('noContainersFound')}
                                </TableCell>
                            </TableRow>
                        )}

                        {noMatch && (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-6 text-center">
                                    {t('noContainersMatchSearch')}
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading &&
                            !isEmpty &&
                            !noMatch &&
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={cn('h-12', row.original.isGroup && 'bg-muted/30')}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="overflow-hidden">
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
                    <span className="text-muted-foreground text-sm">{t('containersPerPage')}:</span>
                    <Select
                        value={pageSize === 'all' ? 'all' : String(pageSize)}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(containerRows.length || 1);
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
