import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Settings } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';

export function CardProcessExecution() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-90 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Settings className="text-primary size-4" />
                    </div>
                    <CardTitle>Processus et exécution</CardTitle>
                </div>
            </CardHeader>
            <CardContent className={'px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-50 overflow-hidden px-6"
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Chemin</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.path}
                            </code>
                        </div>
                        {container.args && container.args.length > 0 && (
                            <div className="flex items-start justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Arguments</span>
                                <code className="bg-muted/50 max-w-md truncate rounded-md px-2 py-1 text-xs">
                                    {container.args.join(' ')}
                                </code>
                            </div>
                        )}
                        {container.cmd && container.cmd.length > 0 && (
                            <div className="flex items-start justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Commande</span>
                                <code className="bg-muted/50 max-w-md truncate rounded-md px-2 py-1 text-xs">
                                    {container.cmd.join(' ')}
                                </code>
                            </div>
                        )}
                        {container.entrypoint && (
                            <div className="flex items-start justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Entrypoint</span>
                                <code className="bg-muted/50 max-w-md truncate rounded-md px-2 py-1 text-xs">
                                    {Array.isArray(container.entrypoint)
                                        ? container.entrypoint.join(' ')
                                        : container.entrypoint}
                                </code>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">
                                Répertoire de travail
                            </span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.workingDir || '—'}
                            </code>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Utilisateur</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.user || 'root'}
                            </code>
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
