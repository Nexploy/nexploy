import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Network } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useTranslations } from 'next-intl';

export function CardNetworkConfig() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerNetworkConfig');

    if (!container) {
        return <Skeleton className={'h-80 flex-2'} />;
    }

    const hasNetworkData = Object.values(container.network).some(Boolean);

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
                {!hasNetworkData ? (
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
                            {container.network.mode && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">
                                        {t('networkMode')}
                                    </span>
                                    <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                        {container.network.mode}
                                    </code>
                                </div>
                            )}
                            {container.network.ipAddress && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">
                                        {t('ipAddress')}
                                    </span>
                                    <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                        {container.network.ipAddress}
                                    </code>
                                </div>
                            )}
                            {container.network.gateway && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">
                                        {t('gateway')}
                                    </span>
                                    <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                        {container.network.gateway}
                                    </code>
                                </div>
                            )}
                            {container.network.macAddress && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">
                                        {t('macAddress')}
                                    </span>
                                    <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                        {container.network.macAddress}
                                    </code>
                                </div>
                            )}
                            {container.network.bridge && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">
                                        {t('bridge')}
                                    </span>
                                    <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                        {container.network.bridge}
                                    </code>
                                </div>
                            )}
                            {container.network.sandboxId && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">
                                        {t('sandboxId')}
                                    </span>
                                    <code className="bg-muted/50 truncate rounded-md px-2 py-1 text-xs">
                                        {container.network.sandboxId}
                                    </code>
                                </div>
                            )}
                            {container.network.endpointId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-sm">
                                        {t('endpointId')}
                                    </span>
                                    <code className="bg-muted/50 truncate rounded-md px-2 py-1 text-xs">
                                        {container.network.endpointId}
                                    </code>
                                </div>
                            )}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
