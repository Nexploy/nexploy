import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Network } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';

export function CardNetworkConfig() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-80 flex-2'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Network className="text-primary size-4" />
                    </div>
                    <CardTitle>Configuration réseau</CardTitle>
                </div>
            </CardHeader>
            <CardContent className={'px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-50 overflow-hidden px-6"
                >
                    <div className="space-y-3">
                        {container.network.mode && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Mode réseau</span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.network.mode}
                                </code>
                            </div>
                        )}
                        {container.network.ipAddress && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Adresse IP</span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.network.ipAddress}
                                </code>
                            </div>
                        )}
                        {container.network.gateway && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Passerelle</span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.network.gateway}
                                </code>
                            </div>
                        )}
                        {container.network.macAddress && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Adresse MAC</span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.network.macAddress}
                                </code>
                            </div>
                        )}
                        {container.network.bridge && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Bridge</span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.network.bridge}
                                </code>
                            </div>
                        )}
                        {container.network.sandboxId && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Sandbox ID</span>
                                <code className="bg-muted/50 truncate rounded-md px-2 py-1 text-xs">
                                    {container.network.sandboxId}
                                </code>
                            </div>
                        )}
                        {container.network.endpointId && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">Endpoint ID</span>
                                <code className="bg-muted/50 truncate rounded-md px-2 py-1 text-xs">
                                    {container.network.endpointId}
                                </code>
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
