'use client';

import { HardDrive, Plus } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { CardInfoVolumes } from '@/components/docker/volume/CardInfoVolumes';
import { TableDockerVolumes } from '@/components/docker/volume/table/TableDockerVolumes';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export default function VolumesPage() {
    const t = useTranslations('docker.pages.volumes');
    const tDocker = useTranslations('docker');

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex justify-between gap-3 px-5'}>
                    <div className={'flex gap-3'}>
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <HardDrive className="text-primary size-7" />
                        </div>
                        <div className={'flex flex-col'}>
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                {t('title')}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={'/docker/volumes/create'}>
                            <Plus />
                            {tDocker('createVolume')}
                        </Link>
                    </Button>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'space-y-8 pb-6'}>
                        <CardInfoVolumes />
                        <TableDockerVolumes />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
