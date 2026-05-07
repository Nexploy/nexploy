import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Network } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge.tsx';

const NETWORK_FIELDS = [
    { key: 'mode', label: 'networkMode' },
    { key: 'ipAddress', label: 'ipAddress' },
    { key: 'gateway', label: 'gateway' },
    { key: 'macAddress', label: 'macAddress' },
    { key: 'bridge', label: 'bridge' },
    { key: 'sandboxId', label: 'sandboxId' },
    { key: 'endpointId', label: 'endpointId' },
] as const;

export function CardNetworkConfig() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerNetworkConfig');

    if (!container) {
        return <Skeleton className={'h-80 flex-2'} />;
    }

    const visibleFields = NETWORK_FIELDS.filter(({ key }) => container.network[key]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Network className="text-primary size-4" />
                    </div>
                    <CardTitle>{t('title')}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className={'px-0'}>
                {visibleFields.length === 0 ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noData')}
                    </div>
                ) : (
                    <ScrollAreaWithShadow
                        colorShadow={'from-card via-card/50'}
                        bottomShadow
                        className="h-50 overflow-hidden px-6"
                    >
                        <div className="space-y-3">
                            {visibleFields.map(({ key, label }, index) => (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between ${index < visibleFields.length - 1 ? 'border-b pb-2' : ''}`}
                                >
                                    <span className="text-muted-foreground text-sm">
                                        {t(label)}
                                    </span>
                                    <Badge
                                        variant={'secondary'}
                                        className={`truncate rounded-md text-xs`}
                                    >
                                        {container.network[key]}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
