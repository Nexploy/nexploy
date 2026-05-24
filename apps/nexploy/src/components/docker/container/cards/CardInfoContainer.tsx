import { Activity, Box, Key, Network } from 'lucide-react';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { containerDisplayState } from '@/utils/containerDisplayState';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function CardInfoContainer() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const t = useTranslations('docker.containerCards');

    if (isConnecting) {
        return (
            <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className={'h-38 flex-1'} />
                ))}
            </div>
        );
    }

    const containerInfoCards = [
        {
            title: t('state'),
            icon: Activity,
            content: container?.state,
            render: () =>
                container?.state && (
                    <Status
                        className="border-0"
                        status={containerDisplayState[container.state] ?? 'offline'}
                        variant="outline"
                    >
                        <StatusIndicator />
                        <div className="truncate text-2xl font-semibold">{container.state}</div>
                    </Status>
                ),
        },
        {
            title: t('image'),
            icon: Box,
            description: `${t('version')} ${container?.image.split(':')[1] || 'latest'}`,
            render: () => (
                <Link href={`/docker/images/${container?.imageId}`} className="group">
                    <div className="truncate text-2xl font-semibold group-hover:underline">
                        {container?.image}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                        {`${t('version')} ${container?.image.split(':')[1] || 'latest'}`}
                    </p>
                </Link>
            ),
        },
        {
            title: t('ports'),
            icon: Network,
            content: container?.network.ports.length,
            description: container?.network.ports.length ? t('exposedPorts') : t('noExposedPorts'),
        },
        {
            title: t('env'),
            icon: Key,
            content: container?.env.length,
            description: t('envVariables'),
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
            {containerInfoCards.map((info, index) => (
                <Card key={index} className="flex flex-col justify-between gap-0 py-6">
                    <CardHeader className="flex flex-row justify-between space-y-0">
                        <CardTitle className="flex h-14 text-sm font-medium">
                            {info.title}
                        </CardTitle>
                        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <info.icon className="text-primary size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {info.render ? (
                            info.render()
                        ) : (
                            <>
                                <div className="truncate text-2xl font-semibold">
                                    {info.content}
                                </div>
                                <p className="text-muted-foreground truncate text-xs">
                                    {info.description}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
