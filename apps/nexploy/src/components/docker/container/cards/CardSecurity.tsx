import { Card, CardContent } from '@workspace/ui/components/card';
import { Shield } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge.tsx';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

export function CardSecurity() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const t = useTranslations('docker.containerCards');

    if (isConnecting) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    const fields = [
        ...(container?.appArmorProfile
            ? [{ label: t('appArmorProfile'), value: container.appArmorProfile }]
            : []),
        ...(container?.mountLabel ? [{ label: t('mountLabel'), value: container.mountLabel }] : []),
        ...(container?.processLabel
            ? [{ label: t('processLabel'), value: container.processLabel }]
            : []),
    ];

    return (
        <Card>
            <CardHeaderWithIcon icon={Shield} title={t('security')} />
            <CardContent>
                {!fields.length ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noSecurityData')}
                    </div>
                ) : (
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
                )}
            </CardContent>
        </Card>
    );
}
