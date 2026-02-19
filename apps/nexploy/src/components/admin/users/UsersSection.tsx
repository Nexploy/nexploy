import { getUserSession } from '@/services/auth/auth.service';
import { getInvitations, getUsers } from '@/services/user.service';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { InvitationsTable } from '@/components/admin/users/InvitationsTable';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function UsersSection() {
    const [t, session, users, invitations] = await Promise.all([
        getTranslations('admin'),
        getUserSession(),
        getUsers(),
        getInvitations(),
    ]);

    const isAdmin = session?.user.role === 'admin';

    return (
        <div className="flex flex-col gap-5">
            <UsersTable users={users} currentUserId={session?.user.id} isAdmin={isAdmin} />
            {isAdmin && invitations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="size-5" />
                            {t('pendingInvitations')} ({invitations.length})
                        </CardTitle>
                        <CardDescription>{t('managePendingInvitations')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InvitationsTable invitations={invitations} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
