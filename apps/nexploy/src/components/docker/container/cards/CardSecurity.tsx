import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Shield } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';

export function CardSecurity() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerCards');

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Shield className="text-primary size-4" />
                    </div>
                    <CardTitle>{t('security')}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {!container.appArmorProfile && !container.mountLabel && !container.processLabel ? (
                    <div className="flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noSecurityData')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {container.appArmorProfile && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">
                                    {t('appArmorProfile')}
                                </span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.appArmorProfile}
                                </code>
                            </div>
                        )}
                        {container.mountLabel && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">
                                    {t('mountLabel')}
                                </span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.mountLabel}
                                </code>
                            </div>
                        )}
                        {container.processLabel && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">
                                    {t('processLabel')}
                                </span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.processLabel}
                                </code>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
