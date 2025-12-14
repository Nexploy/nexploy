'use client';

import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Database, HardDrive, Server } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardInfoVolumes() {
    const volumes = useVolumeStore((state) => state.volumes);
    const lastUpdate = useVolumeStore((state) => state.lastUpdate);

    const isLoading = !volumes.length && !lastUpdate;

    const totalSizeVolumes = volumes.reduce((acc, vol) => acc + (vol.usageData?.Size || 0), 0);
    const totalVolumes = volumes.length;
    const localVolumes = volumes.filter((vol) => vol.driver === 'local').length;

    const totalDiskCapacity = 10 * 1024 * 1024 * 1024;
    const percentUsed = (totalSizeVolumes / totalDiskCapacity) * 100;

    const lastCreated = [...volumes].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )[0];

    const lastCreatedLabel = lastCreated?.createdAt
        ? dayjs(lastCreated.createdAt).format('DD/MM/YYYY')
        : '';

    const lastCreatedName = lastCreated?.name || '-';

    const volumeInfos = [
        {
            title: 'Total Volumes',
            icon: Database,
            content: totalVolumes,
            description: `${localVolumes} volumes locaux`,
        },
        {
            title: 'Espace Utilisé',
            icon: HardDrive,
            content: formatBytes(totalSizeVolumes),
            description: `${percentUsed.toFixed(1)}% de ${formatBytes(totalDiskCapacity)} utilisés`,
        },
        {
            title: 'Drivers',
            icon: Server,
            content: localVolumes,
            description: `${localVolumes} local drivers`,
        },
        {
            title: 'Dernier Volume',
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
                            <CardTitle className="h-14 text-sm font-medium">{info.title}</CardTitle>
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
