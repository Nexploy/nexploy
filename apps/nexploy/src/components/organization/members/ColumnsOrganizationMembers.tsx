'use client';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown, MoreVertical, Shield, ShieldOff, Trash2, X } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import type {
    OrganizationInvitation,
    OrganizationMember,
} from '@workspace/typescript-interface/organization/organization';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import type { UpdateMemberRoleInput } from '@workspace/schemas-zod/organization/updateMemberRole.schema';
import { DicebearAvatar } from '@/components/shared/DicebearAvatar.tsx';

interface MembersColumnsOptions {
    t: TranslationFunction;
    tCommon: TranslationFunction;
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
    tCommon,
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
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    {t('members.member')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const member = row.original;
                const isCurrentUser = member.user.id === currentUserId;

                return (
                    <div className="flex min-w-0 items-center gap-3">
                        <DicebearAvatar seed={member.user.email} size={28} alt="Email Account Image" />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">{member.user.name}</span>
                            {isCurrentUser && <span className="text-muted-foreground text-xs">{t('members.you')}</span>}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'email',
            accessorFn: (member) => member.user.email,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    {t('members.email')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.user.email}</span>,
        },
        {
            id: 'role',
            accessorFn: (member) => member.role,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    {t('members.role')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const member = row.original;
                const canEditRole =
                    canManageMembers && (member.role !== 'owner' || (canTransferOwnership && !isSoleOwner(member)));

                if (!canEditRole) {
                    return (
                        <Badge variant={member.role === 'member' ? 'secondary' : 'default'}>
                            {member.role === 'member' ? (
                                <ShieldOff className="mr-1 size-3" />
                            ) : (
                                <Shield className="mr-1 size-3" />
                            )}
                            {t(`roles.${member.role}`)}
                        </Badge>
                    );
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
                        <SelectContent align="start">
                            <SelectItem value="member">
                                <div className="flex items-center gap-2 truncate">
                                    <ShieldOff className="size-3" />
                                    <span className="truncate">{t('roles.member')}</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="admin">
                                <div className="flex items-center gap-2 truncate">
                                    <Shield className="size-3" />
                                    <span className="truncate">{t('roles.admin')}</span>
                                </div>
                            </SelectItem>
                            {canTransferOwnership && (
                                <SelectItem value="owner">
                                    <div className="flex items-center gap-2 truncate">
                                        <Shield className="size-3" />
                                        <span className="truncate">{t('roles.owner')}</span>
                                    </div>
                                </SelectItem>
                            )}
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
            size: 50,
            cell: ({ row }) => {
                const member = row.original;
                const isCurrentUser = member.user.id === currentUserId;

                if (isCurrentUser || isSoleOwner(member)) return null;

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{tCommon('actions')}</DropdownMenuLabel>
                                <DropdownMenuItem
                                    variant="destructive"
                                    disabled={isRemoving}
                                    onClick={() => onRemove(member)}
                                >
                                    <Trash2 />
                                    {t('members.remove')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}

interface InvitationsColumnsOptions {
    t: TranslationFunction;
    tCommon: TranslationFunction;
    isCancelling: boolean;
    onCancel: (invitation: OrganizationInvitation) => void;
}

export function getColumnsOrganizationInvitations({
    t,
    tCommon,
    isCancelling,
    onCancel,
}: InvitationsColumnsOptions): ColumnDef<OrganizationInvitation>[] {
    return [
        {
            id: 'email',
            accessorFn: (invitation) => invitation.email,
            header: () => t('members.email'),
            cell: ({ row }) => (
                <div className="flex min-w-0 items-center gap-3">
                    <DicebearAvatar seed={row.original.email} size={28} alt="Email Account Image" />
                    <span className="truncate font-medium">{row.original.email}</span>
                </div>
            ),
        },
        {
            id: 'role',
            accessorFn: (invitation) => invitation.role ?? 'member',
            header: () => t('members.role'),
            cell: ({ row }) => {
                const role = row.original.role ?? 'member';

                return (
                    <Badge variant={role === 'member' ? 'secondary' : 'default'}>
                        {role === 'member' ? <ShieldOff className="mr-1 size-3" /> : <Shield className="mr-1 size-3" />}
                        {t(`roles.${role}`)}
                    </Badge>
                );
            },
        },
        {
            id: 'createdAt',
            accessorFn: (invitation) => invitation.createdAt,
            header: () => t('invitations.invitedAt'),
            cell: ({ row }) => (
                <span className="text-muted-foreground">{dayjs(row.original.createdAt).format('DD/MM/YYYY')}</span>
            ),
        },
        {
            id: 'actions',
            size: 50,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{tCommon('actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={isCancelling}
                                onClick={() => onCancel(row.original)}
                            >
                                <X />
                                {t('invitations.cancel')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];
}
