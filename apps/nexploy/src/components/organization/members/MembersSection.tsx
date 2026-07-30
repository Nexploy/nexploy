'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
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

function DataTable<TData>({
    data,
    columns,
    rowClassName,
}: {
    data: TData[];
    columns: ColumnDef<TData>[];
    rowClassName: string;
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="bg-card overflow-hidden rounded-md border shadow-sm">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    style={
                                        header.column.columnDef.size
                                            ? { width: header.column.columnDef.size }
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
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className={rowClassName}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
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

    useEffect(
        () => initializeOrganizationMembersStore(organizationId, members, invitations),
        [organizationId],
    );

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

    const { execute: executeUpdateRole, isPending: isUpdatingRole } = useAction(
        updateMemberRoleAction,
        {
            onSuccess: ({ input }) => updateMemberRoleInStore(input.memberId, input.role),
        },
    );

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
                isCancelling,
                onCancel: (invitation) => executeCancel({ invitationId: invitation.id }),
            }),
        [t, isCancelling],
    );

    return (
        <div className="flex flex-col gap-8">
            <DataTable data={visibleMembers} columns={membersColumns} rowClassName="h-14" />

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
                    />
                </div>
            )}
        </div>
    );
}
