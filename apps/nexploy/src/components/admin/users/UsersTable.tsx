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
import { getColumnsUsers, UserRow } from '@/components/admin/users/ColumnsUsers';
import { useTranslations } from 'next-intl';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { deleteUser } from '@/actions/user/deleteUser.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { banUser } from '@/actions/user/banUser.action';
import { updateUserRole } from '@/actions/user/updateUserRole.action';

interface UsersTableProps {
    users: UserRow[];
    currentUserId?: string;
    canManageUsers?: boolean;
}

const globalFilterFn: FilterFn<UserRow> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, email, role } = row.original;

    return (
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        (role?.toLowerCase().includes(search) ?? false)
    );
};

export function UsersTable({ users, currentUserId, canManageUsers }: UsersTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const t = useTranslations('admin');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { execute: executeUpdateRole, isPending: isUpdatingRole } = useAction(updateUserRole, {
        onSuccess: () => toast.success(t('userRoleUpdated')),
        onError: ({ error }) => toast.error(error.serverError || t('userRoleUpdateFailed')),
    });

    const { execute: executeDelete, isPending: isDeleting } = useAction(deleteUser, {
        onSuccess: () => {
            toast.success(t('userDeletedSuccess'));
            table.resetRowSelection();
        },
        onError: ({ error }) => toast.error(error.serverError || t('userDeleteFailed')),
    });

    const { execute: executeBan, isPending: isBanning } = useAction(banUser, {
        onSuccess: ({ data }) => {
            if (data)
                toast.success(data === 'ban' ? t('userBannedSuccess') : t('userUnbannedSuccess'));
        },
    });

    const handleRoleChange = (userId: string, role: 'guest' | 'developer' | 'admin') => {
        executeUpdateRole({ userId, role });
    };

    const handleDelete = (user: UserRow) => {
        openAlertDialog({
            title: t('deleteUser'),
            description: t('confirmDeleteUser', { name: user.name }),
            cancelLabel: t('cancel'),
            actionLabel: t('deleteUser'),
            onAction: async () => executeDelete({ userId: user.id }),
        });
    };

    const handleActionBan = (user: UserRow) => {
        const isBanned = user.banned;
        openAlertDialog({
            title: isBanned ? t('unbanUser') : t('banUser'),
            description: isBanned
                ? t('confirmUnbanUser', { name: user.name })
                : t('confirmBanUser', { name: user.name }),
            cancelLabel: t('cancel'),
            actionLabel: isBanned ? t('unbanUser') : t('banUser'),
            onAction: async () =>
                executeBan({ userId: user.id, action: isBanned ? 'unban' : 'ban' }),
        });
    };

    const table = useReactTable({
        data: users,
        columns: getColumnsUsers(t, {
            currentUserId,
            isAdmin: canManageUsers,
            isUpdatingRole,
            isDeleting,
            isBanning,
            onRoleChange: handleRoleChange,
            onDelete: handleDelete,
            onBan: handleActionBan,
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
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? users.length : pageSize,
            },
        },
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
    });

    const isShowingAll = pageSize === 'all';
    const isLoading = false;
    const isEmpty = users.length === 0;

    return (
        <div className="space-y-3 pt-1 pb-5">
            <div className="flex flex-wrap justify-between gap-3">
                <Input
                    className="w-56 shadow-xs"
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
                                    {t('noUsers')}
                                </TableCell>
                            </TableRow>
                        ) : !isLoading && table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="py-6 text-center"
                                >
                                    {t('noUsersMatchSearch')}
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{t('usersPerPage')}:</span>
                    <Select
                        value={pageSize === 'all' ? 'all' : String(pageSize)}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(users.length);
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
