import { Warehouse } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { RegistryList } from '@/components/registry/RegistryList';
import { AddRegistryButton } from '@/components/registry/AddRegistryButton';
import { CreateLocalRegistryButton } from '@/components/registry/CreateLocalRegistryButton';
import { MirrorImageSection } from '@/components/registry/MirrorImageSection';
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
                    <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Warehouse className="size-7 text-primary" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <CreateLocalRegistryButton />
                    <AddRegistryButton />
                </div>
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
