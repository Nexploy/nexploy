'use client';

import { PieChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { DiskUsageCard } from '@/components/docker/diskUsage/DiskUsageCard';

export default function DiskUsagePage() {
    const t = useTranslations('docker.pages.diskUsage');

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex h-full flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <PieChart className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight break-all">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="flex flex-col gap-5 pb-5">
                        <DiskUsageCard />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
