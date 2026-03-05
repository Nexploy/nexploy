import { Warehouse } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { RegistryList } from '@/components/admin/registry/RegistryList';
import { AddRegistryButton } from '@/components/admin/registry/AddRegistryButton';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Registry',
    description: 'Manage Docker registries',
};

export default async function RegistryPage() {
    const t = await getTranslations('admin.registry');

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Warehouse className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                {t('title')}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                    <AddRegistryButton />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-5">
                        <RegistryList />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
