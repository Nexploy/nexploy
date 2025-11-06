import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Cpu } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardExecuteId() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Cpu className="text-primary size-4" />
                    </div>
                    <CardTitle>IDs d'exécution ({container.execIds?.length})</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {container.execIds?.map((execId, idx) => (
                        <code key={idx} className="bg-muted/30 block rounded-md p-2 text-xs">
                            {execId}
                        </code>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
