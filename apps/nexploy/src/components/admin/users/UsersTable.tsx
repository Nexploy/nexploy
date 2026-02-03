'use client';

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    FilterFn,
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
import { getColumnsUsers, UserRow } from '@/components/admin/users/ColumnsUsers';
import { useTranslations } from 'next-intl';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, Ban, Trash2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
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
import { banUser, deleteUser, updateUserRole } from '@/actions/auth/users.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface UsersTableProps {
    users: UserRow[];
    currentUserId?: string;
    isAdmin?: boolean;
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

const isSystemUser = (user: UserRow) => user.role === 'system';

export function UsersTable({ users, currentUserId, isAdmin }: UsersTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

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
        onSuccess: ({ data }) =>
            toast.success(data?.user.banned ? t('userBannedSuccess') : t('userUnbannedSuccess')),
        onError: ({ error }) => toast.error(error.serverError || t('userBanUpdateFailed')),
    });

    const handleRoleChange = (userId: string, role: 'admin' | 'user') => {
        executeUpdateRole({ userId, role });
    };

    const handleDelete = (user: UserRow) => {
        openAlertDialog({
            title: t('deleteUser'),
            description: t('confirmDeleteUser', { name: user.name }),
            cancelLabel: t('cancel'),
            actionLabel: t('deleteUser'),
            onAction: async () => {
                await executeDelete({ userId: user.id });
            },
        });
    };

    const handleBan = (user: UserRow) => {
        const isBanned = user.banned;
        openAlertDialog({
            title: isBanned ? t('unbanUser') : t('banUser'),
            description: isBanned
                ? t('confirmUnbanUser', { name: user.name })
                : t('confirmBanUser', { name: user.name }),
            cancelLabel: t('cancel'),
            actionLabel: isBanned ? t('unbanUser') : t('banUser'),
            onAction: async () => {
                await executeBan({ userId: user.id, ban: !isBanned });
            },
        });
    };

    const handleBulkDelete = () => {
        const selectedUsers = table
            .getSelectedRowModel()
            .rows.filter((row) => !isSystemUser(row.original) && row.original.id !== currentUserId);
        const userIds = selectedUsers.map((row) => row.original.id);

        openAlertDialog({
            title: t('deleteUser'),
            description: t('confirmDeleteUsers', { count: userIds.length }),
            cancelLabel: t('cancel'),
            actionLabel: t('deleteUser'),
            onAction: async () => {
                for (const userId of userIds) {
                    await executeDelete({ userId });
                }
                table.resetRowSelection();
            },
        });
    };

    const handleBulkBan = () => {
        const selectedUsers = table
            .getSelectedRowModel()
            .rows.filter((row) => !isSystemUser(row.original) && row.original.id !== currentUserId);
        const userIds = selectedUsers.map((row) => row.original.id);
        const anyNotBanned = selectedUsers.some((row) => !row.original.banned);

        openAlertDialog({
            title: anyNotBanned ? t('banUser') : t('unbanUser'),
            description: anyNotBanned
                ? t('confirmBanUsers', { count: userIds.length })
                : t('confirmUnbanUsers', { count: userIds.length }),
            cancelLabel: t('cancel'),
            actionLabel: anyNotBanned ? t('banUser') : t('unbanUser'),
            onAction: async () => {
                for (const userId of userIds) {
                    await executeBan({ userId, ban: anyNotBanned });
                }
                table.resetRowSelection();
            },
        });
    };

    const columns = useMemo(
        () =>
            getColumnsUsers(t, {
                currentUserId,
                isAdmin,
                isUpdatingRole,
                isDeleting,
                isBanning,
                onRoleChange: handleRoleChange,
                onDelete: handleDelete,
                onBan: handleBan,
            }),
        [t, currentUserId, isAdmin, isUpdatingRole, isDeleting, isBanning],
    );

    const table = useReactTable({
        data: users,
        columns,
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

    const numberOfSelectedRows = Object.keys(rowSelection).length;
    const isShowingAll = pageSize === 'all';
    const isLoading = false;
    const isEmpty = users.length === 0;

    return (
        <div className="space-y-3">
            <div className="flex justify-between">
                <Input
                    className="w-1/4 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                {isAdmin && (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleBulkBan}
                            disabled={!numberOfSelectedRows || isBanning}
                        >
                            <Ban />
                            {t('banUser')}
                            {!!numberOfSelectedRows && (
                                <Badge variant="secondary" className="rounded-full">
                                    {numberOfSelectedRows}
                                </Badge>
                            )}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={!numberOfSelectedRows || isDeleting}
                        >
                            <Trash2 />
                            {t('deleteUser')}
                            {!!numberOfSelectedRows && (
                                <Badge variant="secondary" className="rounded-full">
                                    {numberOfSelectedRows}
                                </Badge>
                            )}
                        </Button>
                    </div>
                )}
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
                        <SelectTrigger size="sm" className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{tCommon('size')}</SelectLabel>
                                {[10, 25, 50, 100].map((size) => (
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
