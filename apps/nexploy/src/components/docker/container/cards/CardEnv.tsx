import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Key } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Badge } from '@workspace/ui/components/badge';

export function CardEnv() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Key className="text-primary size-4" />
                    </div>
                    <CardTitle>
                        Variables d'environnement{' '}
                        <Badge variant={'secondary'}>{container.env.length}</Badge>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className={'px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-72 overflow-hidden px-6"
                >
                    <div className="space-y-2">
                        {container.env.map((envVar, idx) => {
                            const [key, ...valueParts] = envVar.split('=');
                            const value = valueParts.join('=');
                            return (
                                <div
                                    key={idx}
                                    className="bg-muted/30 flex items-start gap-2 rounded-md p-2"
                                >
                                    <code className="text-primary shrink-0 text-xs font-semibold">
                                        {key}:
                                    </code>
                                    <code className="text-xs break-all">{value || '(vide)'}</code>
                                </div>
                            );
                        })}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
