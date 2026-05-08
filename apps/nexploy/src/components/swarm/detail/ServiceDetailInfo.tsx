'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Hash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/shared/CopyButton';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { ReactNode } from 'react';
import dayjs from 'dayjs';

function formatTimestamp(ts: number): string {
    return dayjs(ts).format('DD/MM/YYYY HH:mm:ss');
}

interface ServiceDetailInfoProps {
    service: SwarmService;
}

export function ServiceDetailInfo({ service }: ServiceDetailInfoProps) {
    const t = useTranslations('swarm');

    const fields: { label: string; value: ReactNode; hasCopy?: boolean; copyText?: string }[] = [
        { label: t('detail.serviceId'), value: service.id, hasCopy: true, copyText: service.id },
        { label: t('image'), value: service.image, hasCopy: true, copyText: service.image },
        { label: t('detail.version'), value: String(service.version) },
        {
            label: t('mode'),
            value: (
                <Badge variant="outline" className="capitalize">
                    {service.mode}
                </Badge>
            ),
        },
        ...(service.replicas !== undefined
            ? [{ label: t('replicas'), value: String(service.replicas) }]
            : []),
        { label: t('detail.createdAt'), value: formatTimestamp(service.createdAt) },
        { label: t('detail.updatedAt'), value: formatTimestamp(service.updatedAt) },
        ...(service.updateStatus
            ? [
                  {
                      label: t('updateStatus'),
                      value: (
                          <Badge
                              variant={
                                  service.updateStatus.state === 'completed'
                                      ? 'default'
                                      : service.updateStatus.state === 'updating'
                                        ? 'secondary'
                                        : 'destructive'
                              }
                              className="capitalize"
                          >
                              {service.updateStatus.state}
                          </Badge>
                      ),
                  },
                  ...(service.updateStatus.message
                      ? [{ label: t('detail.updateMessage'), value: service.updateStatus.message }]
                      : []),
              ]
            : []),
    ];

    return (
        <Card>
            <CardHeaderWithIcon icon={Hash} title={t('detail.infoTitle')} />
            <CardContent className="px-0">
                <ScrollAreaWithShadow
                    colorShadow="from-card via-card/50"
                    bottomShadow
                    className="h-60 overflow-hidden px-6"
                >
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={index}
                                className={`grid grid-cols-[auto_1fr] items-center gap-4 ${index < fields.length - 1 ? 'border-b pb-2' : ''}`}
                            >
                                <span className="text-muted-foreground whitespace-nowrap text-sm">
                                    {field.label}
                                </span>
                                <div className="flex min-w-0 items-center justify-end gap-1">
                                    <div className="flex min-w-0 flex-1 justify-end overflow-hidden">
                                        {typeof field.value === 'string' ? (
                                            <Badge
                                                variant="secondary"
                                                className="w-auto max-w-full shrink"
                                            >
                                                <span className="block truncate">
                                                    {field.value}
                                                </span>
                                            </Badge>
                                        ) : (
                                            field.value
                                        )}
                                    </div>
                                    {field.hasCopy && (
                                        <CopyButton
                                            textToCopy={field.copyText ?? ''}
                                            className="size-6 shrink-0"
                                            size="icon"
                                            variant="ghost"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
