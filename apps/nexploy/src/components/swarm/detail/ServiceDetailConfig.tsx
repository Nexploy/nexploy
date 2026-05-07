'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Key, Network, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';

interface ServiceDetailConfigProps {
    service: SwarmService;
}

export function ServiceDetailConfig({ service }: ServiceDetailConfigProps) {
    const t = useTranslations('swarm');

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Ports */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Network className="size-4" />
                        {t('detail.portsTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {service.ports.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('detail.noPorts')}</p>
                    ) : (
                        <div className="space-y-2">
                            {service.ports.map((port, i) => (
                                <div
                                    key={i}
                                    className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 text-sm"
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

            {/* Networks */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Network className="size-4" />
                        {t('detail.networksTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {service.networks.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('detail.noNetworks')}</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {service.networks.map((net, i) => (
                                <Badge key={i} variant="secondary">
                                    {net}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Environment Variables */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="size-4" />
                        {t('detail.envTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {service.env.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('detail.noEnv')}</p>
                    ) : (
                        <div className="space-y-1.5">
                            {service.env.map((entry, i) => {
                                const [key, ...rest] = entry.split('=');
                                return (
                                    <div
                                        key={i}
                                        className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs"
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

            {/* Placement Constraints */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="size-4" />
                        {t('detail.constraintsTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {service.constraints.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            {t('detail.noConstraints')}
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {service.constraints.map((c, i) => (
                                <div
                                    key={i}
                                    className="bg-muted/50 rounded-md px-3 py-1.5 font-mono text-xs"
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
