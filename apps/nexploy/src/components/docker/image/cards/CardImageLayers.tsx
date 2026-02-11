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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">{t('order')}</TableHead>
                                <TableHead className="w-24">{t('size')}</TableHead>
                                <TableHead>{t('layer')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell className="w-16">{index + 1}</TableCell>
                                    <TableCell className="text-muted-foreground w-24">
                                        {formatBytes(entry.size)}
                                    </TableCell>
                                    <TableCell className="max-w-0">
                                        <code className="text-muted-foreground block truncate text-sm">
                                            {entry.createdBy || '—'}
                                        </code>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground text-center text-sm">{t('noLayers')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
