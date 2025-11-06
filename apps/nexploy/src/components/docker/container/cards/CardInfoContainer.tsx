import { Activity, Box, Key, Network } from 'lucide-react';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { containerDisplayState } from '@/utils/containerDisplayState';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardInfoContainer() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return (
            <div className="grid grid-cols-1 gap-5 px-5 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className={'h-38 flex-1'} />
                ))}
            </div>
        );
    }

    const containerInfoCards = [
        {
            title: 'État',
            icon: Activity,
            content: container!.state,
            render: () => (
                <div>
                    <Status
                        className="border-0"
                        status={containerDisplayState[container!.state] ?? 'offline'}
                        variant="outline"
                    >
                        <StatusIndicator />
                        <div className="truncate text-2xl font-semibold">{container!.state}</div>
                    </Status>
                </div>
            ),
        },
        {
            title: 'Image',
            icon: Box,
            content: container!.image.split(':')[0],
            description: `version : ${container!.image.split(':')[1] || 'latest'}`,
        },
        {
            title: 'Ports',
            icon: Network,
            content: container!.network.ports.length,
            description: container!.network.ports.length
                ? 'port(s) exposé(s)'
                : 'Aucun port exposé',
        },
        {
            title: 'Env',
            icon: Key,
            content: container!.env.length,
            description: "Variable(s) d'environnement",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-5 px-5 md:grid-cols-4">
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
