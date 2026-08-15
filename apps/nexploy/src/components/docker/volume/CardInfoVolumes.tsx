'use client';

import { useVolumesStore } from '../../../stores/docker/useVolumesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Database, HardDrive, Server } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';

export function CardInfoVolumes() {
    const t = useTranslations('docker');
    const volumes = useVolumesStore((state) => state.volumes);
    const lastUpdate = useVolumesStore((state) => state.lastUpdate);

    const isLoading = !volumes.length && !lastUpdate;

    const totalSizeVolumes = volumes.reduce((acc, vol) => acc + (vol.usageData?.Size || 0), 0);
    const totalVolumes = volumes.length;
    const localVolumes = volumes.filter((vol) => vol.driver === 'local').length;

    const totalDiskCapacity = 10 * 1024 * 1024 * 1024;
    const percentUsed = (totalSizeVolumes / totalDiskCapacity) * 100;

    const lastCreated = [...volumes].sort(
        (a, b) => dayjs(b.createdAt || 0).valueOf() - dayjs(a.createdAt || 0).valueOf(),
    )[0];

    const lastCreatedLabel = lastCreated?.createdAt ? dayjs(lastCreated.createdAt).format('DD/MM/YYYY') : '';

    const lastCreatedName = lastCreated?.name || '-';

    const volumeInfos = [
        {
            title: t('totalVolumes'),
            icon: Database,
            content: totalVolumes,
            description: t('localVolumes', { count: localVolumes }),
        },
        {
            title: t('spaceUsed'),
            icon: HardDrive,
            content: formatBytes(totalSizeVolumes),
            description: t('percentUsed', {
                percent: percentUsed.toFixed(1),
                total: formatBytes(totalDiskCapacity),
            }),
        },
        {
            title: t('drivers'),
            icon: Server,
            content: localVolumes,
            description: t('localDrivers', { count: localVolumes }),
        },
        {
            title: t('lastVolume'),
            icon: Database,
            content: lastCreatedLabel,
            description: lastCreatedName,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
            {volumeInfos.map((info, index) =>
                isLoading ? (
                    <Skeleton key={index} className="rounded-xl py-19" />
                ) : (
                    <Card key={index} className="flex flex-col justify-between gap-0 py-6">
                        <CardHeader className="flex flex-row justify-between space-y-0">
                            <CardTitle className="h-14 truncate font-medium text-sm">{info.title}</CardTitle>
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <info.icon className="size-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="truncate font-semibold text-2xl">{info.content}</div>
                            <p className="truncate text-muted-foreground text-xs">{info.description}</p>
                        </CardContent>
                    </Card>
                ),
            )}
        </div>
    );
}
