'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Hash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';

function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString();
}

interface ServiceDetailInfoProps {
    service: SwarmService;
}

export function ServiceDetailInfo({ service }: ServiceDetailInfoProps) {
    const t = useTranslations('swarm');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Hash className="size-4" />
                    {t('detail.infoTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
                    <div>
                        <dt className="text-muted-foreground">{t('detail.serviceId')}</dt>
                        <dd className="mt-0.5 font-mono">{service.id.slice(0, 12)}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('image')}</dt>
                        <dd className="mt-0.5 truncate font-mono text-xs">{service.image}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('detail.version')}</dt>
                        <dd className="mt-0.5">{service.version}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('mode')}</dt>
                        <dd className="mt-0.5 capitalize">{service.mode}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('detail.createdAt')}</dt>
                        <dd className="mt-0.5">{formatTimestamp(service.createdAt)}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('detail.updatedAt')}</dt>
                        <dd className="mt-0.5">{formatTimestamp(service.updatedAt)}</dd>
                    </div>
                    {service.updateStatus && (
                        <>
                            <div>
                                <dt className="text-muted-foreground">{t('updateStatus')}</dt>
                                <dd className="mt-0.5 capitalize">{service.updateStatus.state}</dd>
                            </div>
                            {service.updateStatus.message && (
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('detail.updateMessage')}
                                    </dt>
                                    <dd className="mt-0.5 text-xs">
                                        {service.updateStatus.message}
                                    </dd>
                                </div>
                            )}
                        </>
                    )}
                </dl>
            </CardContent>
        </Card>
    );
}
