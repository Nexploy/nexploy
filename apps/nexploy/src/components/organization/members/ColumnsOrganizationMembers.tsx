'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Trash2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import type {
    OrganizationInvitation,
    OrganizationMember,
} from '@workspace/typescript-interface/organization/organization';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import type { UpdateMemberRoleInput } from '@workspace/schemas-zod/organization/updateMemberRole.schema';

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

interface MembersColumnsOptions {
    t: TranslationFunction;
    currentUserId: string;
    ownerCount: number;
    canManageMembers: boolean;
    canTransferOwnership: boolean;
    isUpdatingRole: boolean;
    isRemoving: boolean;
    onRoleChange: (member: OrganizationMember, role: UpdateMemberRoleInput['role']) => void;
    onRemove: (member: OrganizationMember) => void;
}

export function getColumnsOrganizationMembers({
    t,
    currentUserId,
    ownerCount,
    canManageMembers,
    canTransferOwnership,
    isUpdatingRole,
    isRemoving,
    onRoleChange,
    onRemove,
}: MembersColumnsOptions): ColumnDef<OrganizationMember>[] {
    const isSoleOwner = (member: OrganizationMember) => member.role === 'owner' && ownerCount <= 1;

    const columns: ColumnDef<OrganizationMember>[] = [
        {
            id: 'member',
            accessorFn: (member) => member.user.name,
            header: () => t('members.member'),
            cell: ({ row }) => {
                const member = row.original;
                const isCurrentUser = member.user.id === currentUserId;

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(member.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium">
                                {member.user.name}
                                {isCurrentUser && (
                                    <span className="text-muted-foreground ml-2 text-xs">{t('members.you')}</span>
                                )}
                            </span>
                            <span className="text-muted-foreground text-xs">{member.user.email}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'role',
            accessorFn: (member) => member.role,
            header: () => t('members.role'),
            cell: ({ row }) => {
                const member = row.original;
                const canEditRole =
                    canManageMembers && (member.role !== 'owner' || (canTransferOwnership && !isSoleOwner(member)));

                if (!canEditRole) {
                    return <Badge variant="outline">{t(`roles.${member.role}`)}</Badge>;
                }

                return (
                    <Select
                        value={member.role}
                        disabled={isUpdatingRole}
                        onValueChange={(role) => onRoleChange(member, role as UpdateMemberRoleInput['role'])}
                    >
                        <SelectTrigger size="sm" className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="member">{t('roles.member')}</SelectItem>
                            <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                            {canTransferOwnership && <SelectItem value="owner">{t('roles.owner')}</SelectItem>}
                        </SelectContent>
                    </Select>
                );
            },
        },
    ];

    if (!canManageMembers) return columns;

    return [
        ...columns,
        {
            id: 'actions',
            size: 40,
            header: () => null,
            cell: ({ row }) => {
                const member = row.original;
                const isCurrentUser = member.user.id === currentUserId;

                if (isCurrentUser || isSoleOwner(member)) return null;

                return (
                    <Button variant="ghost" size="icon" disabled={isRemoving} onClick={() => onRemove(member)}>
                        <Trash2 className="text-destructive size-4" />
                    </Button>
                );
            },
        },
    ];
}

interface InvitationsColumnsOptions {
    t: TranslationFunction;
    isCancelling: boolean;
    onCancel: (invitation: OrganizationInvitation) => void;
}

export function getColumnsOrganizationInvitations({
    t,
    isCancelling,
    onCancel,
}: InvitationsColumnsOptions): ColumnDef<OrganizationInvitation>[] {
    return [
        {
            id: 'email',
            accessorFn: (invitation) => invitation.email,
            header: () => t('members.email'),
            cell: ({ row }) => row.original.email,
        },
        {
            id: 'role',
            accessorFn: (invitation) => invitation.role ?? 'member',
            header: () => t('members.role'),
            cell: ({ row }) => <Badge variant="outline">{t(`roles.${row.original.role ?? 'member'}`)}</Badge>,
        },
        {
            id: 'actions',
            size: 40,
            header: () => null,
            cell: ({ row }) => (
                <Button variant="ghost" size="icon" disabled={isCancelling} onClick={() => onCancel(row.original)}>
                    <X className="size-4" />
                </Button>
            ),
        },
    ];
}
