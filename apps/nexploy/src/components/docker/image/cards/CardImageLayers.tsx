'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { getImageHistory } from '@/actions/docker/image/imageDetail.action';
import { ImageHistoryEntry } from '@workspace/typescript-interface/docker/docker.image';
import { formatBytes } from '@/utils/formatBytes';

interface CardImageLayersProps {
    imageId: string;
}

export function CardImageLayers({ imageId }: CardImageLayersProps) {
    const t = useTranslations('docker.imageLayers');
    const [history, setHistory] = useState<ImageHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getImageHistory({ imageId }).then((result) => {
            if (result?.data) setHistory(result.data);
            setLoading(false);
        });
    }, [imageId]);

    if (loading) return <Skeleton className="h-80" />;

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                {history.length ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-muted-foreground px-2 py-2 text-left text-sm font-medium">
                                    {t('order')}
                                </th>
                                <th className="text-muted-foreground px-2 py-2 text-left text-sm font-medium">
                                    {t('size')}
                                </th>
                                <th className="text-muted-foreground px-2 py-2 text-left text-sm font-medium">
                                    {t('layer')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((entry, index) => (
                                <tr key={index} className="border-b last:border-b-0">
                                    <td className="w-16 px-2 py-2 text-sm">{index + 1}</td>
                                    <td className="text-muted-foreground w-24 px-2 py-2 text-sm whitespace-nowrap">
                                        {formatBytes(entry.size)}
                                    </td>
                                    <td className="max-w-0 px-2 py-2">
                                        <code className="text-muted-foreground block truncate text-sm">
                                            {entry.createdBy || '—'}
                                        </code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground text-center text-sm">{t('noLayers')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
