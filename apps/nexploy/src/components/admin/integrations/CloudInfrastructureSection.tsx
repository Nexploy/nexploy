import { getCloudflareAccounts } from '@/services/cloudflare.service';
import { getAllAwsAccounts } from '@/services/aws.service';
import { Cloud } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CloudflareAccordionSection } from '@/components/admin/integrations/CloudflareAccordionSection';
import { AwsAccordionSection } from '@/components/admin/integrations/AwsAccordionSection';

export async function CloudInfrastructureSection() {
    const [t, awsAccounts, cloudflareAccounts] = await Promise.all([
        getTranslations('integrations'),
        getAllAwsAccounts(),
        getCloudflareAccounts(),
    ]);

    return (
        <section className="space-y-2">
            <div className="flex items-center gap-2">
                <Cloud className="text-muted-foreground size-4" />
                <h2 className="text-sm font-medium">{t('cloudInfrastructure')}</h2>
            </div>
            <div className={'flex flex-col gap-3'}>
                <CloudflareAccordionSection accounts={cloudflareAccounts} />
                <AwsAccordionSection awsAccounts={awsAccounts} />
            </div>
        </section>
    );
}
