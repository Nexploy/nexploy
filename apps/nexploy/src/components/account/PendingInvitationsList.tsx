'use client';

import { useTranslations } from 'next-intl';
import { useOrganizationStore } from '@/stores/organization/useOrganizationStore';
import { PendingInvitationRow } from '@/components/account/PendingInvitationRow';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';

export function PendingInvitationsList() {
    const t = useTranslations('organization');

    const pendingInvitations = useOrganizationStore((s) => s.pendingInvitations);
    const isInitialized = useOrganizationStore((s) => s.pendingInvitationsInitialized);

    if (!isInitialized) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-40 rounded-full" />
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
            </div>
        );
    }

    if (pendingInvitations.length === 0) {
        return <p className="text-muted-foreground text-sm">{t('invitations.noPendingInvitations')}</p>;
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
