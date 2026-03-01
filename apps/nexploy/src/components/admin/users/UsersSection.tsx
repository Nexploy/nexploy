import { getUserSession } from '@/services/auth/auth.service';
import { getUsers } from '@/services/user.service';
import { UsersTable } from '@/components/admin/users/UsersTable';

export async function UsersSection() {
    const [session, users] = await Promise.all([
        getUserSession(),
        getUsers(),
    ]);

    const isAdmin = session?.user.role === 'admin';

    return (
        <div className="flex flex-col gap-5">
            <UsersTable users={users} currentUserId={session?.user.id} isAdmin={isAdmin} />
        </div>
    );
}
