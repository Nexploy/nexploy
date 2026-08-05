'use client';

import {
    FilterFn,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { getColumnsUsers, UserRow } from '@/components/admin/users/ColumnsUsers';
import { useTranslations } from 'next-intl';
import { Input } from '@workspace/ui/components/input';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteUser } from '@/actions/user/deleteUser.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { banUser } from '@/actions/user/banUser.action';
import { updateUserRole } from '@/actions/user/updateUserRole.action';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

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
            if (data) toast.success(data === 'ban' ? t('userBannedSuccess') : t('userUnbannedSuccess'));
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
            onAction: async () => executeBan({ userId: user.id, action: isBanned ? 'unban' : 'ban' }),
        });
    };

    const pagination = useClientTablePagination();

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
        onPaginationChange: pagination.onPaginationChange,
        state: {
            sorting,
            globalFilter,
            rowSelection,
            pagination: pagination.state,
        },
    });

    pagination.clampToPageCount(table.getPageCount());

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
            <TableShell
                table={table}
                skeletonRows={5}
                emptyLabel={t('noUsers')}
                noResultsLabel={t('noUsersMatchSearch')}
                hasActiveFilters={!isEmpty}
            />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('usersPerPage')}
                allowAllPageSize
            />
        </div>
    );
}
