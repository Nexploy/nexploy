import { Card, CardContent } from '@workspace/ui/components/card';
import { Database } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge.tsx';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

export function CardDriverGraph() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const t = useTranslations('docker.containerCards');

    if (isConnecting) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    if (!container?.graphDriver) {
        return (
            <Card>
                <CardHeaderWithIcon icon={Database} title={t('storageDriver')} />
                <CardContent>
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noDriverData')}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { name, data } = container.graphDriver;

    const fields = [
        { label: t('driverName'), value: name },
        ...(data.deviceId ? [{ label: t('deviceId'), value: data.deviceId }] : []),
        ...(data.deviceName ? [{ label: t('deviceName'), value: data.deviceName }] : []),
        ...(data.deviceSize
            ? [
                  {
                      label: t('deviceSize'),
                      value: `${(parseInt(data.deviceSize) / 1024 / 1024 / 1024).toFixed(2)} GB`,
                  },
              ]
            : []),
    ];

    return (
        <Card>
            <CardHeaderWithIcon icon={Database} title={t('storageDriver')} />
            <CardContent>
                <div className="space-y-3">
                    {fields.map(({ label, value }, index) => (
                        <div
                            key={label}
                            className={`grid grid-cols-[auto_1fr] items-center gap-4 ${index < fields.length - 1 ? 'border-b pb-2' : ''}`}
                        >
                            <span className="text-muted-foreground text-sm whitespace-nowrap">
                                {label}
                            </span>
                            <div className="flex min-w-0 items-center justify-end overflow-hidden">
                                <Badge variant="secondary" className="w-auto max-w-full shrink">
                                    <span className="block truncate">{value}</span>
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
