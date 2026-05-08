'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Key, Network, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useSwarmServiceStore } from '@/stores/docker/useSwarmServiceStore.ts';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';

export function ServiceDetailConfig() {
    const t = useTranslations('swarm');

    const service = useSwarmServiceStore((s) => s.service);
    const isConnecting = useSwarmServiceStore((s) => s.isConnecting);

    if (isConnecting) {
        return <Skeleton className={'h-80 flex-1'} />;
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
                <CardHeaderWithIcon icon={Network} title={t('detail.portsTitle')}>
                    {service && service.ports.length > 0 && (
                        <Badge variant="secondary">{service.ports.length}</Badge>
                    )}
                </CardHeaderWithIcon>
                <CardContent>
                    {service?.ports.length === 0 ? (
                        <p className="text-muted-foreground py-9 text-center text-sm">
                            {t('detail.noPorts')}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {service?.ports.map((port, i) => (
                                <div
                                    key={i}
                                    className="bg-muted/60 flex items-center justify-between rounded-md px-3 py-2 text-sm"
                                >
                                    <span className="font-mono">
                                        {port.publishedPort} → {port.targetPort}
                                    </span>
                                    <div className="flex gap-1.5">
                                        <Badge variant="outline" className="text-xs">
                                            {port.protocol}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {port.publishMode}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeaderWithIcon icon={Network} title={t('detail.networksTitle')}>
                    {service && service.networks.length > 0 && (
                        <Badge variant="secondary">{service.networks.length}</Badge>
                    )}
                </CardHeaderWithIcon>
                <CardContent>
                    {service?.networks.length === 0 ? (
                        <p className="text-muted-foreground py-9 text-center text-sm">
                            {t('detail.noNetworks')}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {service?.networks.map((net, i) => (
                                <Badge key={i} variant="secondary">
                                    {net}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeaderWithIcon icon={Key} title={t('detail.envTitle')}>
                    {service && service.env.length > 0 && (
                        <Badge variant="secondary">{service.env.length}</Badge>
                    )}
                </CardHeaderWithIcon>
                <CardContent>
                    {service?.env.length === 0 ? (
                        <p className="text-muted-foreground py-9 text-center text-sm">
                            {t('detail.noEnv')}
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {service?.env.map((entry, i) => {
                                const [key, ...rest] = entry.split('=');
                                return (
                                    <div
                                        key={i}
                                        className="bg-muted/60 flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs"
                                    >
                                        <span className="text-primary font-semibold">{key}</span>
                                        <span className="text-muted-foreground">=</span>
                                        <span className="truncate">{rest.join('=') || ''}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeaderWithIcon icon={ShieldCheck} title={t('detail.constraintsTitle')}>
                    {service && service.constraints.length > 0 && (
                        <Badge variant="secondary">{service.constraints.length}</Badge>
                    )}
                </CardHeaderWithIcon>
                <CardContent>
                    {service?.constraints.length === 0 ? (
                        <p className="text-muted-foreground py-9 text-center text-sm">
                            {t('detail.noConstraints')}
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {service?.constraints.map((c, i) => (
                                <div
                                    key={i}
                                    className="bg-muted/60 rounded-md px-3 py-1.5 font-mono text-xs"
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
