import { getUserSession } from '@/services/auth/auth.service';
import { getPendingInvitations } from '@/services/organization.service';
import { PendingInvitationsList } from '@/components/account/PendingInvitationsList';

export async function PendingInvitations() {
    const session = await getUserSession();

    if (!session) return null;

    const invitations = await getPendingInvitations(session.user.email);

    return (
        <PendingInvitationsList
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
