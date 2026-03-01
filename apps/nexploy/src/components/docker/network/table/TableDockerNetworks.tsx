'use client';

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import dayjs from 'dayjs';
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
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { getColumnsTableNetworks } from '@/components/docker/network/table/ColumnsDockerNetworks';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { Network } from '@workspace/typescript-interface/docker/docker.network';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, Plus, Trash } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { onNetworkAction } from '@/actions/docker/network/networkAction.action';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { Switch } from '@workspace/ui/components/switch';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const globalFilterFn: FilterFn<Network> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, driver, id, scope } = row.original;

    const date = dayjs.unix(row.original.created).format('DD/MM/YYYY');

    return (
        name?.toLowerCase().includes(search) ||
        driver?.toLowerCase().includes(search) ||
        scope?.toLowerCase().includes(search) ||
        id.toLowerCase().includes(search) ||
        date.toLowerCase().includes(search)
    );
};

export function TableDockerNetworks() {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const networks = useNetworkStore((state) => state.networks);
    const lastUpdate = useNetworkStore((state) => state.lastUpdate);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('docker.tables');
    const tDocker = useTranslations('docker');
    const tCommon = useTranslations('common');

    const columns = useMemo(() => getColumnsTableNetworks(t), [t]);

    const isLoading = !networks.length && !lastUpdate;
    const isEmpty = !networks.length && !!lastUpdate;

    const table = useReactTable({
        data: networks,
        columns,
        getRowId: (originalRow: Network) => originalRow.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? networks.length : pageSize,
            },
        },
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
    });

    const numberOfSelectedRows = Object.keys(rowSelection).length;
    const forceRef = useRef(false);

    const handleDeleteAction = useCallback(() => {
        const networkIds = Object.keys(rowSelection);
        forceRef.current = false;
        openAlertDialog({
            title: tDocker('deleteNetwork'),
            description: (
                <div className={'space-y-4'}>
                    <p>{tDocker('confirmDeleteNetwork')}</p>
                    <label
                        htmlFor={'force-delete'}
                        className={
                            'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'text-destructive text-sm font-medium'}>
                                {tDocker('errors.forceDelete')}
                            </p>
                            <p className={'text-xs'}>{tDocker('errors.forceDeleteDescription')}</p>
                        </div>
                        <Switch
                            id={'force-delete'}
                            className={'data-[state=checked]:!bg-destructive'}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </label>
                </div>
            ),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            onAction: async () => {
                await onNetworkAction({
                    networkIds,
                    action: 'delete',
                    force: forceRef.current,
                });
                table.resetRowSelection();
            },
        });
    }, [rowSelection, openAlertDialog, tDocker, tCommon, table]);

    const isShowingAll = pageSize === 'all';

    return (
        <div className={'mx-5 space-y-3'}>
            <div className={'flex justify-between'}>
                <Input
                    className={'w-1/5 shadow-xs'}
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex gap-3'}>
                    <Button
                        variant={'destructive'}
                        onClick={handleDeleteAction}
                        disabled={!numberOfSelectedRows}
                    >
                        <Trash />
                        {tCommon('remove')}{' '}
                        {!!numberOfSelectedRows && (
                            <Badge variant={'secondary'} className={'rounded-full'}>
                                {numberOfSelectedRows}
                            </Badge>
                        )}
                    </Button>
                    <Button asChild>
                        <Link href={'/docker/networks/create'}>
                            <Plus />
                            {tDocker('createNetwork')}
                        </Link>
                    </Button>
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
                            Array.from({ length: 5 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="h-12">
                                    {table.getAllColumns().map((column) => (
                                        <TableCell key={column.id}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}

                        {!isLoading && isEmpty ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="py-6 text-center"
                                >
                                    {tDocker('noNetworks')}
                                </TableCell>
                            </TableRow>
                        ) : !isLoading && table.getRowModel().rows.length === 0 ? (
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
                                <TableRow
                                    key={row.id}
                                    className={'h-12'}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
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
            <div className={'flex items-center justify-between'}>
                <div className={'flex items-center gap-2'}>
                    <span className="text-muted-foreground text-sm">
                        {tDocker('network')} {tCommon('perPage')}:
                    </span>
                    <Select
                        value={pageSize === 'all' ? 'all' : String(pageSize)}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(networks.length);
                            } else {
                                const size = Number(value);
                                setPageSize(size);
                                table.setPageSize(size);
                            }
                        }}
                    >
                        <SelectTrigger size={'sm'} className="w-24">
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
                    <div className={'flex items-center gap-2'}>
                        <span className="text-muted-foreground text-sm">
                            {tCommon('pageOf', {
                                current: table.getState().pagination.pageIndex + 1,
                                total: table.getPageCount(),
                            })}
                        </span>
                        <div className={'flex gap-1'}>
                            <Button
                                variant={'outline'}
                                size={'sm'}
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className={'h-4 w-4'} />
                                {tCommon('previous')}
                            </Button>
                            <Button
                                variant={'outline'}
                                size={'sm'}
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                {tCommon('next')}
                                <ChevronRight className={'h-4 w-4'} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
