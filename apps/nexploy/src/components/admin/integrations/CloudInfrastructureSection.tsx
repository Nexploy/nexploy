import { getCloudflareAccounts } from '@/services/cloudflare.service';
import { getAllS3Accounts } from '@/services/s3.service';
import { Cloud } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CloudflareAccordionSection } from '@/components/admin/integrations/CloudflareAccordionSection';
import { S3AccordionSection } from '@/components/admin/integrations/S3AccordionSection';

export async function CloudInfrastructureSection() {
    const [t, s3Accounts, cloudflareAccounts] = await Promise.all([
        getTranslations('integrations'),
        getAllS3Accounts(),
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
                <S3AccordionSection s3Accounts={s3Accounts} />
            </div>
        </section>
    );
}
