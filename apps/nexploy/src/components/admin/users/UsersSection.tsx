import { getInvitations, getUsers } from '@/actions/admin/users.action';
import { getUserSession } from '@/services/auth/auth.service';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { InvitationsTable } from '@/components/admin/users/InvitationsTable';
import { InviteUserDialog } from '@/components/admin/users/InviteUserDialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Mail, Users } from 'lucide-react';

export async function UsersSection() {
    const session = await getUserSession();
    const users = await getUsers();
    const invitations = await getInvitations();

    const isAdmin = session?.user.role === 'admin';

    return (
        <div className="flex flex-col gap-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5" />
                            Users ({users.length})
                        </CardTitle>
                        <CardDescription>
                            Manage user accounts and their permissions
                        </CardDescription>
                    </div>
                    {isAdmin && <InviteUserDialog />}
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
                            Pending Invitations ({invitations.length})
                        </CardTitle>
                        <CardDescription>Manage pending user invitations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InvitationsTable invitations={invitations} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
