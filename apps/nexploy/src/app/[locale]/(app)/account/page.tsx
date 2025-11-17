import { User } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { AccountDetailsSection } from '@/components/account/AccountDetailsSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Account',
    description: 'Gérez votre profil utilisateur et préférences avec Nexploy',
};

export default function AccountPage() {
    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex gap-3 px-5'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <User className="text-primary size-7" />
                    </div>
                    <div className={'flex flex-col'}>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Account
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Gérez votre profil utilisateur et préférences
                        </p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'space-y-8 pb-6'}>
                        {/*<CardInfoAccount />*/}
                        <AccountDetailsSection />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
