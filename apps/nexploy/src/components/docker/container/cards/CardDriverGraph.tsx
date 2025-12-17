import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Database } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardDriverGraph() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Database className="text-primary size-4" />
                    </div>
                    <CardTitle>Driver de stockage</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground text-sm">Nom du driver</span>
                        <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                            {container.graphDriver?.name}
                        </code>
                    </div>
                    {container.graphDriver?.data.deviceId && (
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Device ID</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.graphDriver?.data.deviceId}
                            </code>
                        </div>
                    )}
                    {container.graphDriver?.data.deviceName && (
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Device Name</span>
                            <code className="bg-muted/50 truncate rounded-md px-2 py-1 text-xs">
                                {container.graphDriver?.data.deviceName}
                            </code>
                        </div>
                    )}
                    {container.graphDriver?.data.deviceSize && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Device Size</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {(
                                    parseInt(container.graphDriver?.data.deviceSize) /
                                    1024 /
                                    1024 /
                                    1024
                                ).toFixed(2)}{' '}
                                GB
                            </code>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
