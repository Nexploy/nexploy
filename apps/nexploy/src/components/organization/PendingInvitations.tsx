import { getPendingInvitations } from '@/services/organization.service';
import { PendingInvitationsStoreInitializer } from '@/components/organization/PendingInvitationsStoreInitializer';
import { getUserSession } from '@/services/auth/auth.service.ts';

export async function PendingInvitations() {
    const session = await getUserSession();
    if (!session?.user?.email) return null;

    const invitations = await getPendingInvitations(session.user.email);

    return (
        <PendingInvitationsStoreInitializer
            invitations={invitations.map((invitation) => ({
                id: invitation.id,
                role: invitation.role ?? 'member',
                inviterEmail: invitation.user.email,
                organization: {
                    id: invitation.organization.id,
                    name: invitation.organization.name,
                },
            }))}
        />
    );
}
