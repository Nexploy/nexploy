'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/utils/CopyButton';
import { useTranslations } from 'next-intl';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { Badge } from '@workspace/ui/components/badge';

interface CardVolumeDetailsProps {
    volume: Volume | undefined;
}

export function CardVolumeDetails({ volume }: CardVolumeDetailsProps) {
    const t = useTranslations('docker.volumeDetails');

    if (!volume) {
        return <Skeleton className="h-80" />;
    }

    const labelEntries = Object.entries(volume.labels || {});

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('name')}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{volume.name}</span>
                            <CopyButton
                                textToCopy={volume.name}
                                className="size-6"
                                size="icon"
                                variant="ghost"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('driver')}
                        </span>
                        <Badge variant="secondary" className="font-mono">
                            {volume.driver}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('mountpoint')}
                        </span>
                        <div className="flex items-center gap-2">
                            <code className="text-muted-foreground max-w-96 truncate text-xs">
                                {volume.mountpoint}
                            </code>
                            <CopyButton
                                textToCopy={volume.mountpoint}
                                className="size-6"
                                size="icon"
                                variant="ghost"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('scope')}
                        </span>
                        <Badge variant="outline">{volume.scope}</Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('created')}
                        </span>
                        <span className="text-sm">
                            {dayjs(volume.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                    </div>

                    {volume.usageData && (
                        <>
                            <div className="flex items-center gap-4 border-b pb-3">
                                <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                                    {t('size')}
                                </span>
                                <span className="text-sm">
                                    {formatBytes(volume.usageData.Size)}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 border-b pb-3">
                                <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                                    {t('refCount')}
                                </span>
                                <Badge
                                    variant={
                                        volume.usageData.RefCount > 0 ? 'default' : 'secondary'
                                    }
                                >
                                    {volume.usageData.RefCount}
                                </Badge>
                            </div>
                        </>
                    )}

                    <div className="flex gap-4">
                        <span className="text-muted-foreground w-32 shrink-0 pt-1 text-sm font-medium">
                            {t('labels')}
                        </span>
                        {labelEntries.length ? (
                            <div className="flex-1 overflow-hidden">
                                <table className="w-full">
                                    <tbody>
                                        {labelEntries.map(([key, value]) => (
                                            <tr key={key} className="border-b last:border-b-0">
                                                <td className="text-muted-foreground max-w-80 truncate py-2 pr-4 text-sm">
                                                    {key}
                                                </td>
                                                <td className="truncate py-2 text-sm">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <span className="text-muted-foreground pt-1 text-sm">
                                {t('noLabels')}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
