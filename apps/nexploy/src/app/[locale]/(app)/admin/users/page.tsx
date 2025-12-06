import { Users } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { UsersSection } from '@/components/admin/users/UsersSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Users',
    description: 'Manage users, invitations and permissions',
};

export default function UsersPage() {
    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex gap-3 px-5'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Users className="text-primary size-7" />
                    </div>
                    <div className={'flex flex-col'}>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Users
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Manage users, invitations and permissions
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
