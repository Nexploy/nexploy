'use client';

import { useLayoutEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { PendingInvitation } from '@workspace/typescript-interface/organization/organization';
import {
    initializePendingInvitations,
    useOrganizationStore,
} from '@/stores/organization/useOrganizationStore';
import { PendingInvitationRow } from '@/components/account/PendingInvitationRow';

interface PendingInvitationsListProps {
    invitations: PendingInvitation[];
}

export function PendingInvitationsList({ invitations }: PendingInvitationsListProps) {
    const t = useTranslations('organization');

    useLayoutEffect(() => initializePendingInvitations(invitations), []);

    const storeInvitations = useOrganizationStore((s) => s.pendingInvitations);
    const pendingInvitations = storeInvitations ?? invitations;

    if (pendingInvitations.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">{t('invitations.noPendingInvitations')}</p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {pendingInvitations.map((invitation) => (
                <PendingInvitationRow
                    key={invitation.id}
                    invitationId={invitation.id}
                    organizationName={invitation.organization.name}
                    role={invitation.role}
                    inviterEmail={invitation.inviterEmail}
                />
            ))}
        </div>
    );
}
