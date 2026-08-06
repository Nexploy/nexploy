'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    ColumnDef,
    FilterFn,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';
import { Input } from '@workspace/ui/components/input';
import { Mail } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import type {
    OrganizationInvitation,
    OrganizationMember,
} from '@workspace/typescript-interface/organization/organization';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import {
    initializeOrganizationMembersStore,
    useOrganizationMembersStore,
} from '@/stores/organization/useOrganizationMembersStore';
import { removeMemberAction } from '@/actions/organization/removeMember.action';
import { updateMemberRoleAction } from '@/actions/organization/updateMemberRole.action';
import { cancelInvitationAction } from '@/actions/organization/cancelInvitation.action';
import type { UpdateMemberRoleInput } from '@workspace/schemas-zod/organization/updateMemberRole.schema';
import {
    getColumnsOrganizationInvitations,
    getColumnsOrganizationMembers,
} from '@/components/organization/members/ColumnsOrganizationMembers';

interface MembersSectionProps {
    organizationId: string;
    members: OrganizationMember[];
    invitations: OrganizationInvitation[];
    currentUserId: string;
    canManageMembers: boolean;
    callerRole: string | null;
}

const membersGlobalFilterFn: FilterFn<OrganizationMember> = (row, _, value) => {
    const search = value.toLowerCase();
    const { user, role } = row.original;

    return (
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        role.toLowerCase().includes(search)
    );
};

function DataTable<TData>({
    data,
    columns,
    rowClassName,
    emptyLabel,
}: {
    data: TData[];
    columns: ColumnDef<TData>[];
    rowClassName: string;
    emptyLabel: string;
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return <TableShell table={table} rowClassName={rowClassName} emptyLabel={emptyLabel} />;
}

export function MembersSection({
    organizationId,
    members,
    invitations,
    currentUserId,
    canManageMembers,
    callerRole,
}: MembersSectionProps) {
    const t = useTranslations('organization');
    const tCommon = useTranslations('common');
    const { openAlertDialog } = useAlertConfirmationDialogStore();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');

    useEffect(() => initializeOrganizationMembersStore(organizationId, members, invitations), [organizationId]);

    const storeOrganizationId = useOrganizationMembersStore((s) => s.organizationId);
    const storeMembers = useOrganizationMembersStore((s) => s.members);
    const storeInvitations = useOrganizationMembersStore((s) => s.invitations);
    const removeMemberFromStore = useOrganizationMembersStore((s) => s.removeMember);
    const updateMemberRoleInStore = useOrganizationMembersStore((s) => s.updateMemberRole);
    const removeInvitationFromStore = useOrganizationMembersStore((s) => s.removeInvitation);

    const isStoreReady = storeOrganizationId === organizationId;
    const visibleMembers = isStoreReady ? storeMembers : members;
    const visibleInvitations = isStoreReady ? storeInvitations : invitations;

    const ownerCount = visibleMembers.filter((member) => member.role === 'owner').length;

    const { execute: executeRemove, isPending: isRemoving } = useAction(removeMemberAction, {
        onSuccess: ({ input }) => removeMemberFromStore(input.memberIdOrEmail),
    });

    const { execute: executeUpdateRole, isPending: isUpdatingRole } = useAction(updateMemberRoleAction, {
        onSuccess: ({ input }) => updateMemberRoleInStore(input.memberId, input.role),
    });

    const { execute: executeCancel, isPending: isCancelling } = useAction(cancelInvitationAction, {
        onSuccess: ({ input }) => removeInvitationFromStore(input.invitationId),
    });

    const canTransferOwnership = callerRole === 'owner';

    const handleRoleChange = (member: OrganizationMember, role: UpdateMemberRoleInput['role']) => {
        if (role !== 'owner') {
            executeUpdateRole({ organizationId, memberId: member.id, role });
            return;
        }

        openAlertDialog({
            title: t('members.transferOwnership'),
            description: t('members.confirmTransferOwnership', { name: member.user.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('members.transferOwnership'),
            onAction: async () => executeUpdateRole({ organizationId, memberId: member.id, role }),
        });
    };

    const handleRemove = (member: OrganizationMember) => {
        openAlertDialog({
            title: t('members.remove'),
            description: t('members.confirmRemove', { name: member.user.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('members.remove'),
            onAction: async () => executeRemove({ organizationId, memberIdOrEmail: member.id }),
        });
    };

    const membersColumns = useMemo(
        () =>
            getColumnsOrganizationMembers({
                t,
                tCommon,
                currentUserId,
                ownerCount,
                canManageMembers,
                canTransferOwnership,
                isUpdatingRole,
                isRemoving,
                onRoleChange: handleRoleChange,
                onRemove: handleRemove,
            }),
        [
            t,
            tCommon,
            organizationId,
            currentUserId,
            ownerCount,
            canManageMembers,
            canTransferOwnership,
            isUpdatingRole,
            isRemoving,
        ],
    );

    const invitationsColumns = useMemo(
        () =>
            getColumnsOrganizationInvitations({
                t,
                tCommon,
                isCancelling,
                onCancel: (invitation) => executeCancel({ invitationId: invitation.id }),
            }),
        [t, tCommon, isCancelling],
    );

    const pagination = useClientTablePagination();

    const membersTable = useReactTable({
        data: visibleMembers,
        columns: membersColumns,
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: membersGlobalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: pagination.onPaginationChange,
        state: {
            sorting,
            globalFilter,
            pagination: pagination.state,
        },
    });

    pagination.clampToPageCount(membersTable.getPageCount());

    const isEmpty = visibleMembers.length === 0;

    return (
        <div className="flex flex-col gap-8">
            <div className="space-y-3">
                <div className="flex flex-wrap justify-between gap-3">
                    <Input
                        className="w-56 shadow-xs"
                        placeholder={tCommon('searchPlaceholder')}
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </div>

                <TableShell
                    table={membersTable}
                    rowClassName="h-14"
                    emptyLabel={t('members.noMembers')}
                    noResultsLabel={tCommon('noMatchSearch')}
                    hasActiveFilters={!isEmpty}
                />

                <TablePagination
                    table={membersTable}
                    pageSize={pagination.pageSize}
                    onPageSizeChange={pagination.setPageSize}
                    perPageLabel={t('members.perPage')}
                    allowAllPageSize
                />
            </div>

            {canManageMembers && visibleInvitations.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="size-4" />
                        {t('invitations.pending')}
                    </h2>
                    <DataTable
                        data={visibleInvitations}
                        columns={invitationsColumns}
                        rowClassName="h-12"
                        emptyLabel={tCommon('noResults')}
                    />
                </div>
            )}
        </div>
    );
}
