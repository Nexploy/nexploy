import { GlobeLock } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import { getCertificates } from '@/services/sslCertificate.service';
import { SSLCertificatesTable } from '@/components/ssl/SSLCertificatesTable';
import { AddSSLButton } from '@/components/ssl/AddSSLButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SSL Certificates',
    description: 'Manage SSL/TLS certificates',
};

export default async function SSLCertificatesPage() {
    const [t, certificates] = await Promise.all([getTranslations('admin.ssl'), getCertificates()]);

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <GlobeLock className="size-7 text-primary" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                    <AddSSLButton />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-5">
                        <SSLCertificatesTable certificates={certificates} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
