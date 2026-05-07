'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/shared/CopyButton';
import { useTranslations } from 'next-intl';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { useImageStore } from '@/stores/docker/useImageStore.ts';
import { Table, TableBody, TableCell, TableRow } from '@workspace/ui/components/table';

export function CardImageDetails() {
    const t = useTranslations('docker.imageDetails');
    const image = useImageStore((state) => state.image);

    if (!image) return <Skeleton className="h-80" />;

    const labels = image.labels || {};
    const labelEntries = Object.entries(labels);

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('id')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                <div className="flex items-center gap-2">
                                    <CopyButton
                                        textToCopy={image.id}
                                        className="size-6"
                                        size="icon"
                                        variant="ghost"
                                    />
                                    <code className="block truncate text-xs">{image.id}</code>
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('size')}daz
                            </TableCell>
                            <TableCell className="max-w-0 truncate">
                                {formatBytes(image.size)}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('created')}
                            </TableCell>
                            <TableCell className={'max-w-0 truncate'}>
                                {dayjs(image.created).format('YYYY-MM-DD HH:mm:ss')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('build')}
                            </TableCell>
                            <TableCell className={'max-w-0 truncate'}>
                                {t('buildValue', {
                                    os: image.os || 'unknown',
                                    architecture: image.architecture || 'unknown',
                                })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 align-top font-medium">
                                {t('labels')}
                            </TableCell>
                            <TableCell className={'max-w-0'}>
                                {labelEntries.length ? (
                                    <div className="flex flex-col gap-1">
                                        {labelEntries.map(([key, value]) => (
                                            <div key={key} className="flex gap-2 text-sm">
                                                <span className="text-muted-foreground">{key}</span>
                                                <span className="truncate">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('noLabels')}</span>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
