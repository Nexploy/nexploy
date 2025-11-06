import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Box } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import dayjs from 'dayjs';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardInfoDetail() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-90 flex-2'} />;
    }

    return (
        <Card className={'flex-2'}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Box className="text-primary size-4" />
                    </div>
                    <CardTitle>Informations détaillées</CardTitle>
                </div>
            </CardHeader>
            <CardContent className={'px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-60 overflow-hidden px-6"
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">ID complet</span>
                            <code className="bg-muted/50 truncate rounded-md px-2 py-1 text-xs">
                                {container.id}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Nom</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.name}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Image</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.image}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Plateforme</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.platform}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Driver</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.driver}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">État</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.state}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Statut</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.status}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">En cours</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.running ? 'Oui' : 'Non'}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">En pause</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.paused ? 'Oui' : 'Non'}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Redémarrage</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.restarting ? 'Oui' : 'Non'}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Mort</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.dead ? 'Oui' : 'Non'}
                            </code>
                        </div>
                        {container.health && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Santé</span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.health.status}
                                </code>
                            </div>
                        )}
                        {container.exitCode !== undefined && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">
                                    Code de sortie
                                </span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {container.exitCode}
                                </code>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Nb. redémarrages</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.restartCount}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Créé le</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {dayjs(container.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                            </code>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Démarré le</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.startedAt
                                    ? dayjs(container.startedAt).format('DD/MM/YYYY HH:mm:ss')
                                    : '—'}
                            </code>
                        </div>
                        {container.finishedAt && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Terminé le</span>
                                <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                    {dayjs(container.finishedAt).format('DD/MM/YYYY HH:mm:ss')}
                                </code>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                                Dernière mise à jour
                            </span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {dayjs(container.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                            </code>
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
