import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Plug } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { GitProvidersSection } from '@/components/admin/integrations/GitProvidersSection';
import { CloudInfrastructureSection } from '@/components/admin/integrations/CloudInfrastructureSection';

export default async function IntegrationsPage() {
    const t = await getTranslations('integrations');

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Plug className="size-7 text-primary" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="flex flex-col gap-5 pb-5">
                        <GitProvidersSection />
                        <CloudInfrastructureSection />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
