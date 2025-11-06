import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Database } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardVolumes() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-80 flex-2'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Database className="text-primary size-4" />
                    </div>
                    <CardTitle>Volumes montés ({container.mounts.length})</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-64 overflow-hidden"
                >
                    <div className="space-y-3">
                        {container.mounts.map((mount, idx) => (
                            <div key={idx} className="bg-muted space-y-2 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary/20 text-primary rounded px-2 py-1 text-xs font-medium">
                                        {mount.type}
                                    </span>
                                    <span className="bg-secondary rounded px-2 py-1 text-xs">
                                        {mount.rw ? 'RW' : 'RO'}
                                    </span>
                                    {mount.name && (
                                        <code className="text-xs font-medium">{mount.name}</code>
                                    )}
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground">Source:</span>
                                        <code className="break-all">{mount.source}</code>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground">Destination:</span>
                                        <code className="break-all">{mount.destination}</code>
                                    </div>
                                    {mount.driver && (
                                        <div className="flex gap-2">
                                            <span className="text-muted-foreground">Driver:</span>
                                            <code>{mount.driver}</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
