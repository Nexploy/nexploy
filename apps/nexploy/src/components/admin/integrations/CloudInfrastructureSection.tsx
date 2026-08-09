import { getDnsAccounts } from '@/services/dns/dnsCredential.service';
import { getAllBucketStorageAccounts } from '@/services/bucketStorage.service';
import { Cloud } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DnsAccordionSection } from '@/components/admin/integrations/DnsAccordionSection';
import { BucketStorageAccordionSection } from '@/components/admin/integrations/BucketStorageAccordionSection';

export async function CloudInfrastructureSection() {
    const [t, bucketStorageAccounts, dnsAccounts] = await Promise.all([
        getTranslations('integrations'),
        getAllBucketStorageAccounts(),
        getDnsAccounts(),
    ]);

    return (
        <section className="space-y-2">
            <div className="flex items-center gap-2">
                <Cloud className="text-muted-foreground size-4" />
                <h2 className="text-sm font-medium">{t('cloudInfrastructure')}</h2>
            </div>
            <div className={'flex flex-col gap-3'}>
                <DnsAccordionSection accounts={dnsAccounts} />
                <BucketStorageAccordionSection bucketStorageAccounts={bucketStorageAccounts} />
            </div>
        </section>
    );
}
