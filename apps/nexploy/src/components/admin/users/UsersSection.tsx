import { getUserSession } from '@/services/auth/auth.service';
import { getUsers } from '@/services/user.service';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { hasPermission } from '@/lib/auth/permissions';

export async function UsersSection() {
    const [session, users] = await Promise.all([
        getUserSession(),
        getUsers(),
    ]);

    const role = session?.user.role ?? '';
    const canManageUsers = hasPermission(role, 'user', 'ban');

    return (
        <div className="flex flex-col gap-5">
            <UsersTable users={users} currentUserId={session?.user.id} canManageUsers={canManageUsers} />
        </div>
    );
}
