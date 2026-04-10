'use client';

import { EthernetPort, Plus } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { CardInfoNetworks } from '@/components/docker/network/CardInfoNetworks';
import { TableDockerNetworks } from '@/components/docker/network/table/TableDockerNetworks';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export default function NetworksPage() {
    const t = useTranslations('docker.pages.networks');
    const tDocker = useTranslations('docker');

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className={'flex justify-between gap-3 px-5'}>
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <EthernetPort className="text-primary size-7" />
                    </div>
                    <div className={'flex flex-col'}>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href={'/docker/networks/create'}>
                        <Plus />
                        {tDocker('createNetwork')}
                    </Link>
                </Button>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className={'space-y-8 pb-6'}>
                    <CardInfoNetworks />
                    <TableDockerNetworks />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
