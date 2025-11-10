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

    const fields = [
        { label: 'ID complet', value: container.id },
        { label: 'Nom', value: container.name },
        { label: 'Image', value: container.image },
        { label: 'Plateforme', value: container.platform },
        { label: 'Driver', value: container.driver },
        { label: 'État', value: container.state },
        { label: 'Statut', value: container.status },
        { label: 'En cours', value: container.running ? 'Oui' : 'Non' },
        { label: 'En pause', value: container.paused ? 'Oui' : 'Non' },
        { label: 'Redémarrage', value: container.restarting ? 'Oui' : 'Non' },
        { label: 'Mort', value: container.dead ? 'Oui' : 'Non' },
        ...(container.health ? [{ label: 'Santé', value: container.health.status }] : []),
        ...(container.exitCode !== undefined
            ? [{ label: 'Code de sortie', value: container.exitCode }]
            : []),
        { label: 'Nb. redémarrages', value: container.restartCount },
        { label: 'Créé le', value: dayjs(container.createdAt).format('DD/MM/YYYY HH:mm:ss') },
        {
            label: 'Démarré le',
            value: container.startedAt
                ? dayjs(container.startedAt).format('DD/MM/YYYY HH:mm:ss')
                : '—',
        },
        ...(container.finishedAt
            ? [
                  {
                      label: 'Terminé le',
                      value: dayjs(container.finishedAt).format('DD/MM/YYYY HH:mm:ss'),
                  },
              ]
            : []),
        {
            label: 'Dernière mise à jour',
            value: dayjs(container.timestamp).format('DD/MM/YYYY HH:mm:ss'),
        },
    ];

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
                        {fields.map((field, index) => (
                            <div
                                key={field.label}
                                className={`flex items-center justify-between gap-4 ${
                                    index < fields.length - 1 ? 'border-b pb-2' : ''
                                }`}
                            >
                                <span className="text-muted-foreground shrink-0 text-sm">
                                    {field.label}
                                </span>
                                <code className="bg-muted/50 truncate rounded-md px-2 py-1 text-xs">
                                    {field.value}
                                </code>
                            </div>
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
