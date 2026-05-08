import { Users } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { UsersSection } from '@/components/admin/users/UsersSection';
import { AddUserButton } from '@/components/admin/users/AddUserButton';
import { getUserSession } from '@/services/auth/auth.service';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Users',
    description: 'Manage users and permissions',
};

export default async function UsersPage() {
    const [t, session] = await Promise.all([getTranslations('admin'), getUserSession()]);
    const isAdmin = session?.user.role === 'admin';

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Users className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {t('users')}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {t('manageUsersDescription')}
                            </p>
                        </div>
                    </div>
                    {isAdmin && <AddUserButton />}
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-5">
                        <UsersSection />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
