'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Check, X } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useOrganizationStore } from '@/stores/organization/useOrganizationStore';
import { acceptInvitationAction } from '@/actions/organization/acceptInvitation.action';
import { rejectInvitationAction } from '@/actions/organization/rejectInvitation.action';

interface PendingInvitationRowProps {
    invitationId: string;
    organizationName: string;
    role: string;
    inviterEmail: string;
}

export function PendingInvitationRow({
    invitationId,
    organizationName,
    role,
    inviterEmail,
}: PendingInvitationRowProps) {
    const t = useTranslations('organization');
    const setOrganizations = useOrganizationStore((s) => s.setOrganizations);
    const removePendingInvitation = useOrganizationStore((s) => s.removePendingInvitation);

    const { execute: executeAccept, isPending: isAccepting } = useAction(acceptInvitationAction, {
        onSuccess: ({ data, input }) => {
            removePendingInvitation(input.invitationId);
            if (data?.organizations) setOrganizations(data.organizations);
        },
    });

    const { execute: executeReject, isPending: isRejecting } = useAction(rejectInvitationAction, {
        onSuccess: ({ input }) => removePendingInvitation(input.invitationId),
    });

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-3">
                    <span className="truncate font-medium">{organizationName}</span>
                    <Badge variant="outline" className="w-fit shrink-0">
                        {t(`roles.${role}`)}
                    </Badge>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                        {t('invitations.invitedBy')}
                    </span>
                    <Badge variant="outline" className="w-fit shrink-0">
                        {inviterEmail}
                    </Badge>
                </div>
            </div>
            <div className="flex shrink-0 gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isAccepting || isRejecting}
                    onClick={() => executeReject({ invitationId })}
                >
                    <X className="size-4" />
                    {t('invitations.reject')}
                </Button>
                <Button
                    size="sm"
                    disabled={isAccepting || isRejecting}
                    onClick={() => executeAccept({ invitationId })}
                >
                    <Check className="size-4" />
                    {t('invitations.accept')}
                </Button>
            </div>
        </div>
    );
}
