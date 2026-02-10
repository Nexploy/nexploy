'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/utils/CopyButton';
import { useTranslations } from 'next-intl';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { useImageStore } from '@/stores/docker/useImageStore';

interface CardImageDetailsProps {
    imageId: string;
}

export function CardImageDetails({ imageId }: CardImageDetailsProps) {
    const t = useTranslations('docker.imageDetails');
    const image = useImageStore((state) => state.getImage(imageId));

    if (!image) return <Skeleton className="h-80" />;

    const labels = image.labels || {};
    const labelEntries = Object.entries(labels);

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b pb-3">
                        <span className="text-muted-foreground shrink-0 text-sm font-medium">
                            {t('id')}
                        </span>
                        <div className="flex items-center gap-2">
                            <code className="text-muted-foreground max-w-96 truncate text-xs">
                                {image.fullId || image.id}
                            </code>
                            <CopyButton
                                textToCopy={image.fullId || image.id}
                                className="size-6"
                                size="icon"
                                variant="ghost"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-24 shrink-0 text-sm font-medium">
                            {t('size')}
                        </span>
                        <span className="text-sm">{formatBytes(image.size)}</span>
                    </div>
                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-24 shrink-0 text-sm font-medium">
                            {t('created')}
                        </span>
                        <span className="text-sm">
                            {dayjs.unix(image.created).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-24 shrink-0 text-sm font-medium">
                            {t('build')}
                        </span>
                        <span className="text-sm">
                            {t('buildValue', {
                                os: image.os || 'unknown',
                                architecture: image.architecture || 'unknown',
                            })}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-muted-foreground w-24 shrink-0 pt-1 text-sm font-medium">
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
