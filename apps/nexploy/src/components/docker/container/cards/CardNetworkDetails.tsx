import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Network } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardNetworkDetails() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Network className="text-primary size-4" />
                    </div>
                    <CardTitle>
                        Réseaux connectés{' '}
                        <Badge variant={'secondary'}>
                            {Object.keys(container.network.networks).length}
                        </Badge>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.entries(container.network.networks).map(
                        ([networkName, networkInfo]) => (
                            <div key={networkName} className="bg-muted/30 space-y-3 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary rounded px-2 py-1 text-sm font-semibold">
                                        {networkName}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Adresse IP:</span>
                                        <code className="bg-background/50 block rounded px-2 py-1">
                                            {networkInfo.ipAddress}
                                        </code>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Passerelle:</span>
                                        <code className="bg-background/50 block rounded px-2 py-1">
                                            {networkInfo.gateway}
                                        </code>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">MAC Address:</span>
                                        <code className="bg-background/50 block rounded px-2 py-1">
                                            {networkInfo.macAddress}
                                        </code>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Préfixe IP:</span>
                                        <code className="bg-background/50 block rounded px-2 py-1">
                                            /{networkInfo.ipPrefixLen}
                                        </code>
                                    </div>
                                    {networkInfo.globalIPv6Address && (
                                        <>
                                            <div className="col-span-2 space-y-1">
                                                <span className="text-muted-foreground">IPv6:</span>
                                                <code className="bg-background/50 block rounded px-2 py-1 break-all">
                                                    {networkInfo.globalIPv6Address}
                                                </code>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">
                                                    Gateway IPv6:
                                                </span>
                                                <code className="bg-background/50 block rounded px-2 py-1">
                                                    {networkInfo.ipv6Gateway || '—'}
                                                </code>
                                            </div>
                                        </>
                                    )}
                                    <div className="col-span-2 space-y-1">
                                        <span className="text-muted-foreground">Endpoint ID:</span>
                                        <code className="bg-background/50 block truncate rounded px-2 py-1">
                                            {networkInfo.endpointId}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
