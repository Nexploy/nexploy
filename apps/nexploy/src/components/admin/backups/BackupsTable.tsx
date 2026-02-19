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
import { useState } from 'react';
import { getColumnsBackups } from '@/components/admin/backups/ColumnsBackups';
import { useTranslations } from 'next-intl';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';
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
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { toast } from 'sonner';
import { Backup } from '@/components/admin/backups/BackupsSection';
import { formatBytes } from '@/utils/formatBytes';

interface BackupsTableProps {
    backups: Backup[];
}

const globalFilterFn: FilterFn<Backup> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, volumeName, storage, status } = row.original;
    const size = formatBytes(row.original.size);

    return (
        name.toLowerCase().includes(search) ||
        volumeName.toLowerCase().includes(search) ||
        storage.toLowerCase().includes(search) ||
        status.toLowerCase().includes(search) ||
        size.toLowerCase().includes(search)
    );
};

export function BackupsTable({ backups }: BackupsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const t = useTranslations('admin');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const handleDelete = (backup: Backup) => {
        openAlertDialog({
            title: t('deleteBackup'),
            description: t('confirmDeleteBackup'),
            cancelLabel: t('cancel'),
            actionLabel: t('deleteBackup'),
            onAction: async () => {
                // TODO: Implement delete action
                toast.success(t('backupDeletedSuccess'));
            },
        });
    };

    const handleRestore = (backup: Backup) => {
        openAlertDialog({
            title: t('restoreBackup'),
            description: t('confirmRestoreBackup'),
            cancelLabel: t('cancel'),
            actionLabel: t('restoreBackup'),
            onAction: async () => {
                // TODO: Implement restore action
                toast.success(t('backupRestoredSuccess'));
            },
        });
    };

    const handleDownload = (backup: Backup) => {
        // TODO: Implement download action
        toast.success(t('downloadBackup'));
    };

    const table = useReactTable({
        data: backups,
        columns: getColumnsBackups(t, {
            onDelete: handleDelete,
            onRestore: handleRestore,
            onDownload: handleDownload,
        }),
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
    });

    const isShowingAll = pageSize === 'all';
    const isLoading = false;
    const isEmpty = backups.length === 0;

    return (
        <div className="space-y-3 pt-1 pb-5">
            <div className="flex justify-between">
                <Input
                    className="w-1/4 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>
            <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        {!isEmpty &&
                            table.getHeaderGroups().map((headerGroup) => (
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
                                    className="py-12 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                            <Database className="text-muted-foreground size-5" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            {t('noBackups')}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="h-12"
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
            {!isEmpty && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                            {t('backupsPerPage')}:
                        </span>
                        <Select
                            value={pageSize === 'all' ? 'all' : String(pageSize)}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    setPageSize('all');
                                    table.setPageSize(backups.length);
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
            )}
        </div>
    );
}
