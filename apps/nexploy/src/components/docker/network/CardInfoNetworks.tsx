'use client';

import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Globe, Network, Share2, Shield } from 'lucide-react';
import dayjs from 'dayjs';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

export function CardInfoNetworks() {
    const t = useTranslations('docker');
    const networks = useNetworkStore((state) => state.networks);
    const lastUpdate = useNetworkStore((state) => state.lastUpdate);

    const isLoading = !networks.length && !lastUpdate;

    const networkInfos = useMemo(() => {
        const totalNetworks = networks.length;
        const customNetworks = networks.filter(
            (net) => !['bridge', 'host', 'none'].includes(net.name),
        ).length;
        const connectedContainers = networks.reduce(
            (acc, net) => acc + (net.containers?.length || 0),
            0,
        );

        const lastCreated = [...networks].sort((a, b) => b.created - a.created)[0];

        const lastCreatedLabel = lastCreated?.created
            ? dayjs.unix(lastCreated.created).format('DD/MM/YYYY')
            : '';

        const lastCreatedName = lastCreated?.name || '<none>';

        return [
            {
                title: t('totalNetworks'),
                icon: Network,
                content: totalNetworks,
                description: t('systemNetworks', { count: totalNetworks - customNetworks }),
            },
            {
                title: t('customNetworks'),
                icon: Share2,
                content: customNetworks,
                description: t('createdByUser', { count: customNetworks }),
            },
            {
                title: t('connectedContainers'),
                icon: Globe,
                content: connectedContainers,
                description: t('totalActiveConnections'),
            },
            {
                title: t('lastNetwork'),
                icon: Shield,
                content: lastCreatedLabel,
                description: lastCreatedName,
            },
        ];
    }, [networks, t]);

    return (
        <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
            {networkInfos.map((info, index) =>
                isLoading ? (
                    <Skeleton key={index} className="rounded-xl py-19" />
                ) : (
                    <Card key={index} className="flex flex-col justify-between gap-0 py-6">
                        <CardHeader className="flex flex-1 flex-row justify-between space-y-0">
                            <CardTitle className="flex h-14 text-sm font-medium">
                                {info.title}
                            </CardTitle>
                            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                <info.icon className="text-primary size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{info.content}</div>
                            <p className="text-muted-foreground truncate text-xs">
                                {info.description}
                            </p>
                        </CardContent>
                    </Card>
                ),
            )}
        </div>
    );
}
