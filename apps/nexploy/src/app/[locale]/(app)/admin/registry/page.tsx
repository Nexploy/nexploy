import { Warehouse } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { RegistryList } from '@/components/admin/registry/RegistryList';
import { AddRegistryButton } from '@/components/admin/registry/AddRegistryButton';
import { MirrorImageSection } from '@/components/admin/registry/MirrorImageSection';
import { getRegistries } from '@/services/registry.service';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Registry',
    description: 'Manage Docker registries',
};

export default async function RegistryPage() {
    const [t, registries] = await Promise.all([getTranslations('admin.registry'), getRegistries()]);

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <div className="flex justify-between gap-2 px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Warehouse className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight break-all">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>
                <AddRegistryButton />
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className="flex flex-col gap-4 px-5 pb-5">
                    <MirrorImageSection registries={registries} />
                    <RegistryList />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
