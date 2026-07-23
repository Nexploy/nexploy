import { getUserSession } from '@/services/auth/auth.service';
import { getPendingInvitations } from '@/services/organization.service';
import { getTranslations } from 'next-intl/server';
import { PendingInvitationRow } from '@/components/account/PendingInvitationRow';

export async function PendingInvitations() {
    const session = await getUserSession();
    const t = await getTranslations('organization');

    if (!session) return null;

    const invitations = await getPendingInvitations(session.user.email);

    if (invitations.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">{t('invitations.noPendingInvitations')}</p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {invitations.map((invitation) => (
                <PendingInvitationRow
                    key={invitation.id}
                    invitationId={invitation.id}
                    organizationName={invitation.organization.name}
                    role={invitation.role ?? 'member'}
                />
            ))}
        </div>
    );
}
