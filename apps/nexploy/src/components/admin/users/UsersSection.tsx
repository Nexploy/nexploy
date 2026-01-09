import { getInvitations, getUsers } from '@/actions/auth/users.action';
import { getUserSession } from '@/services/auth/auth.service';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { InvitationsTable } from '@/components/admin/users/InvitationsTable';
import { AddUserButton } from '@/components/admin/users/AddUserButton';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Mail, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function UsersSection() {
    const session = await getUserSession();
    const users = await getUsers();
    const invitations = await getInvitations();
    const t = await getTranslations('admin');

    const isAdmin = session?.user.role === 'admin';

    return (
        <div className="flex flex-col gap-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5" />
                            {t('users')} ({users.length})
                        </CardTitle>
                        <CardDescription>
                            {t('manageUsersDescription')}
                        </CardDescription>
                    </div>
                    {isAdmin && <AddUserButton />}
                </CardHeader>
                <CardContent>
                    <UsersTable users={users} currentUserId={session?.user.id} isAdmin={isAdmin} />
                </CardContent>
            </Card>

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
