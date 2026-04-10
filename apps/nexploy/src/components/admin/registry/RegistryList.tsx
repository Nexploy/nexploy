import { getRegistries } from '@/services/registry.service';
import { RegistryCard } from '@/components/admin/registry/RegistryCard';
import { getTranslations } from 'next-intl/server';

export async function RegistryList() {
    const [registries, t] = await Promise.all([getRegistries(), getTranslations('admin.registry')]);

    if (registries.length === 0) {
        return (
            <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
                {t('noRegistries')}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <span className={'text-muted-foreground px-1 text-sm font-medium'}>
                Liste registres
            </span>
            <div className={'flex flex-col gap-3'}>
                {registries.map((registry) => (
                    <RegistryCard key={registry.id} registry={registry} />
                ))}
            </div>
        </div>
    );
}
