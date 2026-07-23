import { Building2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { OrganizationsList } from '@/components/organization/OrganizationsList';
import { CreateOrganizationButton } from '@/components/organization/CreateOrganizationButton';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Organizations',
    description: 'Manage your organizations',
};

export default async function OrganizationsPage() {
    const t = await getTranslations('organization');

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Building2 className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {t('myOrganizations')}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                    <CreateOrganizationButton />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-5">
                        <OrganizationsList />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
