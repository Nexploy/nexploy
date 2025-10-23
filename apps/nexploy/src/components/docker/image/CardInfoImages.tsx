'use client';

import { useImageStore } from '@/stores/useImageStore';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { HardDrive, LayoutList, Tag } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardInfoImages() {
    const images = useImageStore((state) => state.images);
    const lastUpdate = useImageStore((state) => state.lastUpdate);

    const isLoading = !images.length && !lastUpdate;

    const totalSizeImages = images.reduce((acc, image) => acc + (image.size || 0), 0);
    const activeImagesCount = images.filter((img) => img.containersUsed > 0).length;
    const totalImages = images.length;

    const totalDiskCapacity = 2 * 1024 * 1024 * 1024;
    const percentUsed = (totalSizeImages / totalDiskCapacity) * 100;

    // const activePercent = totalImages > 0 ? (activeImagesCount / totalImages) * 100 : 0;

    const lastUpdated = [...images].sort(
        (a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime(),
    )[0];

    const lastUpdatedLabel = lastUpdated?.created
        ? dayjs.unix(lastUpdated.created).format('DD/MM/YYYY')
        : '';

    const lastUpdatedName = lastUpdated?.name?.[0] || '<none>';

    const imageInfos = [
        {
            title: 'Total Images',
            icon: LayoutList,
            content: totalImages,
            description: `${totalImages - activeImagesCount} images non utilisée`,
        },
        {
            title: 'Espace Utilisé',
            icon: HardDrive,
            content: formatBytes(totalSizeImages),
            description: `${percentUsed.toFixed(1)}% de ${formatBytes(totalDiskCapacity)} utilisés`,
        },
        {
            title: 'Images Actives',
            icon: Tag,
            content: activeImagesCount,
            description: `${activeImagesCount} utilisées par des conteneurs`,
        },
        {
            title: 'Last Image',
            icon: LayoutList,
            content: lastUpdatedLabel,
            description: lastUpdatedName,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-5 px-6 md:grid-cols-4">
            {imageInfos.map((info, index) =>
                isLoading ? (
                    <Skeleton key={index} className="rounded-xl py-19" />
                ) : (
                    <Card key={index} className="flex flex-col justify-between py-6">
                        <CardHeader className="flex flex-row justify-between space-y-0">
                            <CardTitle className="text-sm font-medium">{info.title}</CardTitle>
                            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                <info.icon className="text-primary size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{info.content}</div>
                            <p className="text-muted-foreground text-xs">{info.description}</p>
                        </CardContent>
                    </Card>
                ),
            )}
        </div>
    );
}
