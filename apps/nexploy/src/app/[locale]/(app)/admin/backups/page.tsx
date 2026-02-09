import { Database } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { BackupsSection } from '@/components/admin/backups/BackupsSection';
import { CreateBackupButton } from '@/components/admin/backups/CreateBackupButton';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Backups',
    description: 'Backup and restore Docker volume data',
};

export default async function BackupsPage() {
    const t = await getTranslations('admin');

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Database className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                {t('backups')}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {t('manageBackupsDescription')}
                            </p>
                        </div>
                    </div>
                    <CreateBackupButton />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-6">
                        <BackupsSection />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
