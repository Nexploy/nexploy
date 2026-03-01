'use client';

import { useImageStore } from '@/stores/docker/useImageStore';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { HardDrive, LayoutList, Tag } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export function CardInfoImages() {
    const t = useTranslations('docker');
    const images = useImageStore((state) => state.images);
    const lastUpdate = useImageStore((state) => state.lastUpdate);

    const isLoading = !images.length && !lastUpdate;

    const { totalSizeImages, activeImagesCount, totalImages, lastUpdatedLabel, lastUpdatedName } =
        useMemo(() => {
            const total = images.reduce((acc, image) => acc + (image.size || 0), 0);
            const active = images.filter((img) => img.containersUsed > 0).length;
            const lastUpdated = [...images].sort(
                (a, b) => dayjs(b.created || 0).valueOf() - dayjs(a.created || 0).valueOf(),
            )[0];
            return {
                totalSizeImages: total,
                activeImagesCount: active,
                totalImages: images.length,
                lastUpdatedLabel: lastUpdated?.created
                    ? dayjs(lastUpdated.created).format('DD/MM/YYYY')
                    : '',
                lastUpdatedName: lastUpdated?.name?.[0] || '<none>',
            };
        }, [images]);

    const imageInfos = [
        {
            title: t('totalImages'),
            icon: LayoutList,
            content: totalImages,
        },
        {
            title: t('spaceUsed'),
            icon: HardDrive,
            content: formatBytes(totalSizeImages),
        },
        {
            title: t('activeImages'),
            icon: Tag,
            content: activeImagesCount,
        },
        {
            title: t('lastImage'),
            icon: LayoutList,
            content: lastUpdatedLabel,
            description: lastUpdatedName,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-2 lg:grid-cols-4">
            {imageInfos.map((info) =>
                isLoading ? (
                    <Skeleton key={info.title} className="rounded-xl py-19" />
                ) : (
                    <Card key={info.title} className="flex flex-col justify-between gap-0 py-6">
                        <CardHeader className="flex flex-row justify-between space-y-0">
                            <CardTitle className="flex h-14 text-sm font-medium">
                                {info.title}
                            </CardTitle>
                            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                <info.icon className="text-primary size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{info.content}</div>
                            <p className="text-muted-foreground truncate text-xs">
                                {info.description}
                            </p>
                        </CardContent>
                    </Card>
                ),
            )}
        </div>
    );
}
