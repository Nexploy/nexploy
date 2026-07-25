'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Badge } from '@workspace/ui/components/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Mail, Trash2, X } from 'lucide-react';
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

interface MembersSectionProps {
    organizationId: string;
    members: OrganizationMember[];
    invitations: OrganizationInvitation[];
    currentUserId: string;
    canManageMembers: boolean;
}

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

export function MembersSection({
    organizationId,
    members,
    invitations,
    currentUserId,
    canManageMembers,
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

    const handleRemove = (member: OrganizationMember) => {
        openAlertDialog({
            title: t('members.remove'),
            description: t('members.confirmRemove', { name: member.user.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('members.remove'),
            onAction: async () => executeRemove({ organizationId, memberIdOrEmail: member.id }),
        });
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('members.member')}</TableHead>
                            <TableHead>{t('members.role')}</TableHead>
                            {canManageMembers && <TableHead className="w-10" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleMembers.map((member) => {
                            const isCurrentUser = member.user.id === currentUserId;
                            const isSoleOwner = member.role === 'owner' && ownerCount <= 1;

                            return (
                                <TableRow key={member.id} className="h-14">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8">
                                                <AvatarImage src={member.user.image || undefined} />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(member.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {member.user.name}
                                                    {isCurrentUser && (
                                                        <span className="text-muted-foreground ml-2 text-xs">
                                                            {t('members.you')}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {member.user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {canManageMembers && member.role !== 'owner' ? (
                                            <Select
                                                value={member.role}
                                                disabled={isUpdatingRole}
                                                onValueChange={(role) =>
                                                    executeUpdateRole({
                                                        organizationId,
                                                        memberId: member.id,
                                                        role: role as 'admin' | 'member',
                                                    })
                                                }
                                            >
                                                <SelectTrigger size="sm" className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="member">
                                                        {t('roles.member')}
                                                    </SelectItem>
                                                    <SelectItem value="admin">
                                                        {t('roles.admin')}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant="outline">
                                                {t(`roles.${member.role}`)}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    {canManageMembers && (
                                        <TableCell>
                                            {!isCurrentUser && !isSoleOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isRemoving}
                                                    onClick={() => handleRemove(member)}
                                                >
                                                    <Trash2 className="text-destructive size-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {canManageMembers && visibleInvitations.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="size-4" />
                        {t('invitations.pending')}
                    </h2>
                    <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('members.email')}</TableHead>
                                    <TableHead>{t('members.role')}</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleInvitations.map((invitation) => (
                                    <TableRow key={invitation.id} className="h-12">
                                        <TableCell>{invitation.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {t(`roles.${invitation.role ?? 'member'}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isCancelling}
                                                onClick={() =>
                                                    executeCancel({ invitationId: invitation.id })
                                                }
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
