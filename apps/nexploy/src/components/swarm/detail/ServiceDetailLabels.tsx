'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Tags } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useSwarmServiceStore } from '@/stores/docker/useSwarmServiceStore.ts';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';

export function ServiceDetailLabels() {
    const t = useTranslations('swarm');

    const service = useSwarmServiceStore((s) => s.service);
    const isConnecting = useSwarmServiceStore((s) => s.isConnecting);

    const entries = Object.entries(service?.labels ?? {});

    if (isConnecting) {
        return <Skeleton className={'h-80 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <CardHeaderWithIcon as="div" icon={Tags} title={t('labels')}>
                        {entries.length > 0 && <Badge variant="secondary">{entries.length}</Badge>}
                    </CardHeaderWithIcon>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {entries.length > 0 ? (
                    <ScrollAreaWithShadow bottomShadow className="h-50 overflow-hidden px-6">
                        <div className="space-y-2">
                            {entries.map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3 rounded-md bg-muted/60 px-3 py-2">
                                    <span className="min-w-0 shrink-0 font-mono text-muted-foreground text-xs">
                                        {key}
                                    </span>
                                    <span className="ml-auto truncate font-mono text-xs">{value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                ) : (
                    <div className="flex h-32 items-center justify-center pb-12 font-semibold text-muted-foreground text-sm">
                        {t('detail.noLabels')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
