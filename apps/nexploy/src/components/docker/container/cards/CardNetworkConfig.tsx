import { Card, CardContent } from '@workspace/ui/components/card';
import { Network } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge.tsx';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';

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
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const t = useTranslations('docker.containerNetworkConfig');

    if (isConnecting) {
        return <Skeleton className={'h-80 flex-2'} />;
    }

    const visibleFields = NETWORK_FIELDS.filter(({ key }) => container?.network?.[key]);

    return (
        <Card>
            <CardHeaderWithIcon icon={Network} title={t('title')} />
            <CardContent className={'px-0'}>
                {!visibleFields.length ? (
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
                                    className={`grid grid-cols-[auto_1fr] items-center gap-4 ${index < visibleFields.length - 1 ? 'border-b pb-2' : ''}`}
                                >
                                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                                        {t(label)}
                                    </span>
                                    <div className="flex min-w-0 items-center justify-end overflow-hidden">
                                        <Badge
                                            variant="secondary"
                                            className="w-auto max-w-full shrink"
                                        >
                                            <span className="block truncate">
                                                {container?.network?.[key]}
                                            </span>
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
