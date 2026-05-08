import { User } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { AccountDetailsSection } from '@/components/account/AccountDetailsSection';
import { ScrollToHash } from '@/components/account/ScrollToHash';
import { getTranslations } from 'next-intl/server';

export default async function AccountPage() {
    const t = await getTranslations('account');

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex gap-3 px-5'}>
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <User className="text-primary size-7" />
                    </div>
                    <div className={'mt-3.5 flex flex-col'}>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className={'space-y-8 pb-5'}>
                        <ScrollToHash>
                            <AccountDetailsSection />
                        </ScrollToHash>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
