import { Globe } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { TableDomains } from '@/components/domains/TableDomains.tsx';
import { AddDomainButton } from '@/components/domains/AddDomainButton';
import type { Metadata } from 'next';
import { getDomains } from '@/services/traefik.service.ts';

export const metadata: Metadata = {
    title: 'Domains',
    description: 'Manage domains and routing across all repositories',
};

export default async function DomainsPage() {
    const [t, domains] = await Promise.all([
        getTranslations('repository.settings.domains'),
        getDomains(),
    ]);

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Globe className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {t('pageTitle')}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('pageDescription')}</p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <AddDomainButton />
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-5">
                        <TableDomains domains={domains} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
