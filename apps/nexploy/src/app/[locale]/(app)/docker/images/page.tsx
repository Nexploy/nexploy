'use client';

import { LayoutList } from 'lucide-react';
import { TableDockerImages } from '@/components/docker/image/table/TableDockerImages';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { CardInfoImages } from '@/components/docker/image/CardInfoImages';

export default function ImagesPage() {
    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className={'flex gap-3 px-5'}>
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <LayoutList className="text-primary size-7" />
                </div>
                <div className={'flex flex-col'}>
                    <h1 className="text-3xl leading-none font-semibold tracking-tight">
                        Docker Images
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Gérez et visualisez toutes vos images Docker
                    </p>
                </div>
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
