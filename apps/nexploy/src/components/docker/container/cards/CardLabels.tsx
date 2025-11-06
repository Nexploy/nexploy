import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { HardDrive } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardLabels() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <HardDrive className="text-primary size-4" />
                    </div>
                    <CardTitle>Labels ({Object.keys(container.labels).length})</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Object.entries(container.labels).map(([key, value], idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between gap-4 border-b pb-2 last:border-0"
                        >
                            <span className="text-muted-foreground truncate text-sm">{key}</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {value}
                            </code>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
