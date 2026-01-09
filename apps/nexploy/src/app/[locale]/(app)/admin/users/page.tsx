import { Users } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { UsersSection } from '@/components/admin/users/UsersSection';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Users',
    description: 'Manage users, invitations and permissions',
};

export default async function UsersPage() {
    const t = await getTranslations('admin');

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex gap-3 px-5'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Users className="text-primary size-7" />
                    </div>
                    <div className={'flex flex-col'}>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('users')}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {t('manageUsersDescription')}
                        </p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className={'space-y-8 pb-6'}>
                        <UsersSection />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
