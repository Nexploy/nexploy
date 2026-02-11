import { Card, CardContent } from '@workspace/ui/components/card';
import { Box } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import dayjs from 'dayjs';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ReactNode } from 'react';

export function CardInfoDetail() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerDetails');

    if (!container) {
        return <Skeleton className={'h-90 flex-2'} />;
    }

    const fields: { label: string; value: ReactNode; href?: string }[] = [
        { label: t('fullId'), value: container.id },
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
        <Card className={'flex-2'}>
            <CardHeaderWithIcon icon={Box} title={t('detailedInfo')} />
            <CardContent className={'px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-60 overflow-hidden px-6"
                >
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={field.label}
                                className={`flex items-center justify-between gap-4 ${
                                    index < fields.length - 1 ? 'border-b pb-2' : ''
                                }`}
                            >
                                <span className="text-muted-foreground shrink-0 text-sm">
                                    {field.label}
                                </span>
                                {field.href ? (
                                    <Link href={field.href}>
                                        <code className="bg-muted/60 truncate rounded-md px-2 py-1 text-xs hover:underline">
                                            {field.value}
                                        </code>
                                    </Link>
                                ) : (
                                    <code className="bg-muted/60 truncate rounded-md px-2 py-1 text-xs">
                                        {field.value}
                                    </code>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
