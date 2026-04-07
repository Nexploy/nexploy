import { Card, CardContent } from '@workspace/ui/components/card';
import { Box } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import dayjs from 'dayjs';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ReactNode } from 'react';
import CopyButton from '@/components/shared/CopyButton';
import { Table, TableBody, TableCell, TableRow } from '@workspace/ui/components/table';

export function CardInfoDetail() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerDetails');

    if (!container) {
        return <Skeleton className="h-90 flex-2" />;
    }

    const fields: { label: string; value: ReactNode; href?: string; hasCopy?: boolean }[] = [
        { label: t('fullId'), value: container.id, hasCopy: true },
        { label: t('name'), value: container.name },
        { label: t('image'), value: container.image, href: `/docker/images/${container.imageId}` },
        { label: t('platform'), value: container.platform },
        { label: t('driver'), value: container.driver },
        { label: t('state'), value: container.state },
        { label: t('status'), value: container.status },
        { label: t('isRunning'), value: container.running ? t('yes') : t('no') },
        { label: t('isPaused'), value: container.paused ? t('yes') : t('no') },
        { label: t('isRestarting'), value: container.restarting ? t('yes') : t('no') },
        { label: t('isDead'), value: container.dead ? t('yes') : t('no') },
        ...(container.health ? [{ label: t('health'), value: container.health.status }] : []),
        ...(container.exitCode !== undefined
            ? [{ label: t('exitCode'), value: container.exitCode }]
            : []),
        { label: t('restartCount'), value: container.restartCount },
        { label: t('createdAt'), value: dayjs(container.createdAt).format('DD/MM/YYYY HH:mm:ss') },
        {
            label: t('startedAt'),
            value: container.startedAt
                ? dayjs(container.startedAt).format('DD/MM/YYYY HH:mm:ss')
                : '—',
        },
        ...(container.finishedAt
            ? [
                  {
                      label: t('finishedAt'),
                      value: dayjs(container.finishedAt).format('DD/MM/YYYY HH:mm:ss'),
                  },
              ]
            : []),
        {
            label: t('lastUpdated'),
            value: dayjs(container.timestamp).format('DD/MM/YYYY HH:mm:ss'),
        },
    ];

    return (
        <Card className="flex-2">
            <CardHeaderWithIcon icon={Box} title={t('detailedInfo')} />
            <CardContent className="px-0">
                <ScrollAreaWithShadow
                    colorShadow="from-card via-card/50"
                    bottomShadow
                    className="h-60 overflow-hidden px-6"
                >
                    <Table>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-muted-foreground w-40 font-medium whitespace-nowrap">
                                        {field.label}
                                    </TableCell>
                                    <TableCell className="max-w-0 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {field.hasCopy && (
                                                <CopyButton
                                                    textToCopy={field.value as string}
                                                    className="size-6 shrink-0"
                                                    size="icon"
                                                    variant="ghost"
                                                />
                                            )}
                                            {field.href ? (
                                                <Link href={field.href} className="min-w-0">
                                                    <code className="block truncate text-xs hover:underline">
                                                        {field.value}
                                                    </code>
                                                </Link>
                                            ) : (
                                                <code className="block truncate text-xs">
                                                    {field.value}
                                                </code>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
