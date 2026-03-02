'use client';

import { Database } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { VolumesBackupList } from '@/components/admin/backups/VolumesBackupList';
import { useTranslations } from 'next-intl';

export default function BackupsPage() {
    const t = useTranslations('admin');

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-4">
                <div className="flex gap-3 px-5">
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
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-5">
                        <VolumesBackupList />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
