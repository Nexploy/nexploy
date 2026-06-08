'use client';

import { LayoutList, Plus } from 'lucide-react';
import { TableDockerImages } from '@/components/docker/image/table/TableDockerImages';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { CardInfoImages } from '@/components/docker/image/CardInfoImages';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { Can } from '@/components/permission/Can';

export default function ImagesPage() {
    const t = useTranslations('docker.pages.images');
    const tDocker = useTranslations('docker');

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <div className={'flex justify-between gap-3 px-5'}>
                <div className={'flex gap-3'}>
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <LayoutList className="text-primary size-7" />
                    </div>
                    <div className={'mt-3.5 flex flex-col'}>
                        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>
                <Can resource="docker" action="manage">
                    <Button asChild className={'mt-5'}>
                        <Link href={'/docker/images/pull'}>
                            <Plus />
                            {tDocker('pullImage')}
                        </Link>
                    </Button>
                </Can>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className={'space-y-8 pb-5'}>
                    <CardInfoImages />
                    <TableDockerImages />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
