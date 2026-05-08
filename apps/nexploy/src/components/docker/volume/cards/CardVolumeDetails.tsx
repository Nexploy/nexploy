'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/shared/CopyButton';
import { useTranslations } from 'next-intl';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { Badge } from '@workspace/ui/components/badge';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { Table, TableBody, TableCell, TableRow } from '@workspace/ui/components/table';

export function CardVolumeDetails() {
    const t = useTranslations('docker.volumeDetails');
    const volume = useVolumeStore((state) => state.volume);

    if (!volume) {
        return <Skeleton className="h-96" />;
    }

    const labelEntries = Object.entries(volume.labels || {});

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('name')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-medium">{volume.name}</span>
                                    <CopyButton
                                        textToCopy={volume.name}
                                        className="size-6 shrink-0"
                                        size="icon"
                                        variant="ghost"
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('driver')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                <Badge variant="secondary" className="font-mono">
                                    {volume.driver}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('mountpoint')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                <div className="flex items-center gap-2">
                                    <code className="text-muted-foreground block truncate text-xs">
                                        {volume.mountpoint}
                                    </code>
                                    <CopyButton
                                        textToCopy={volume.mountpoint}
                                        className="size-6 shrink-0"
                                        size="icon"
                                        variant="ghost"
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('scope')}
                            </TableCell>
                            <TableCell className="max-w-0 truncate">
                                <Badge variant="outline">{volume.scope}</Badge>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('created')}
                            </TableCell>
                            <TableCell className="max-w-0 truncate">
                                {dayjs(volume.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            </TableCell>
                        </TableRow>
                        {volume.usageData && volume.usageData.Size >= 0 && (
                            <TableRow>
                                <TableCell className="text-muted-foreground w-32 font-medium">
                                    {t('size')}
                                </TableCell>
                                <TableCell className="max-w-0 truncate">
                                    {formatBytes(volume.usageData.Size)}
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 align-top font-medium">
                                {t('labels')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                {labelEntries.length ? (
                                    <div className="flex flex-col gap-1">
                                        {labelEntries.map(([key, value]) => (
                                            <div key={key} className="flex gap-2 text-sm">
                                                <span className="text-muted-foreground shrink-0">{key}</span>
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
