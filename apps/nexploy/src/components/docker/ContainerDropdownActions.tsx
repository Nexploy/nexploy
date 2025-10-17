import { Fragment, startTransition } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import {
    ContainerState,
    ContainerTool,
    DockerAction,
} from '@workspace/typescript-interface/docker';
import { toast } from 'sonner';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import {
    Eye,
    Info,
    Pause,
    Play,
    RotateCw,
    Square,
    Network,
    TrendingUp,
    Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSheetStore } from '@/stores/useSheetStore';
import { ContainerInspectInfo } from 'dockerode';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@workspace/ui/components/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface ContainerDropdownActionsProps {
    containerId: string;
    containerName: string;
    containerState: ContainerState;
}

const messageAction: Record<DockerAction, string> = {
    start: 'démarre',
    stop: "s'arrête",
    pause: 'se met en pause',
    restart: 'redémarre',
};

export function ContainerDropdownActions({
    containerName,
    containerId,
    containerState,
}: ContainerDropdownActionsProps) {
    const router = useRouter();
    const { openSheet } = useSheetStore();

    const handleAction = async (action: DockerAction) => {
        try {
            toast.success(`Le conteneur ${containerName} ${messageAction[action]}`);
            await drinoDocker.post(`/containers/${containerId}/${action}`, null).consume();
            startTransition(() => {
                router.refresh();
            });
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                toast.error(err.error.message);
            }
        }
    };

    const handleActionInfo = async () => {
        try {
            const containerInfo = await drinoDocker
                .get<ContainerInspectInfo>(`/containers/${containerId}/info`)
                .consume();

            console.log(containerInfo);

            openSheet({
                title: `Informations - ${containerName}`,
                description: `ID: ${containerId.substring(0, 12)}`,
                content: (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>État</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p>
                                    Status:{' '}
                                    <Badge variant="secondary">{containerInfo.State.Status}</Badge>
                                </p>
                                <p>
                                    Running:{' '}
                                    {containerInfo.State.Running ? (
                                        <Badge>Oui</Badge>
                                    ) : (
                                        <Badge variant="destructive">Non</Badge>
                                    )}
                                </p>
                                <p>
                                    Paused:{' '}
                                    {containerInfo.State.Paused ? (
                                        <Badge>Oui</Badge>
                                    ) : (
                                        <Badge variant="secondary">Non</Badge>
                                    )}
                                </p>
                                {containerInfo.State.StartedAt && (
                                    <p>
                                        Démarré:{' '}
                                        {new Date(containerInfo.State.StartedAt).toLocaleString(
                                            'fr-FR',
                                        )}
                                    </p>
                                )}
                                {containerInfo.State.Error && (
                                    <p className="text-destructive">
                                        Erreur: {containerInfo.State.Error}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Image</CardTitle>
                            </CardHeader>
                            <CardContent className="font-mono text-sm">
                                {containerInfo.Image}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Réseau</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 font-mono text-sm">
                                {containerInfo.NetworkSettings.IPAddress && (
                                    <p>IP: {containerInfo.NetworkSettings.IPAddress}</p>
                                )}
                                {containerInfo.NetworkSettings.Gateway && (
                                    <p>Gateway: {containerInfo.NetworkSettings.Gateway}</p>
                                )}
                                {Object.keys(containerInfo.NetworkSettings.Ports || {}).length >
                                    0 && (
                                    <>
                                        <Separator className="my-2" />
                                        <p className="text-muted-foreground">Ports:</p>
                                        <div className="space-y-1 text-xs">
                                            {Object.entries(
                                                containerInfo.NetworkSettings.Ports,
                                            ).map(([port, bindings]) => (
                                                <p key={port}>
                                                    {port} →{' '}
                                                    {bindings
                                                        ? bindings
                                                              .map(
                                                                  (b) =>
                                                                      `${b.HostIp}:${b.HostPort}`,
                                                              )
                                                              .join(', ')
                                                        : 'non mappé'}
                                                </p>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {containerInfo.Config.Env.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Variables d'environnement</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
                                    {containerInfo.Config.Env.map((env, idx) => (
                                        <p key={idx} className="break-all">
                                            {env}
                                        </p>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {containerInfo.Mounts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Volumes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs">
                                    {containerInfo.Mounts.map((mount, idx) => (
                                        <Card key={idx} className="border p-2">
                                            <p className="font-mono">
                                                {mount.Source} → {mount.Destination}
                                            </p>
                                            <p className="text-muted-foreground">
                                                Type: {mount.Type} | Mode: {mount.Mode}
                                            </p>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Ressources */}
                        {(containerInfo.HostConfig.Memory || containerInfo.HostConfig.NanoCpus) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ressources</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    {containerInfo.HostConfig.Memory && (
                                        <p>
                                            Mémoire:{' '}
                                            {(
                                                containerInfo.HostConfig.Memory /
                                                1024 /
                                                1024
                                            ).toFixed(0)}{' '}
                                            MB
                                        </p>
                                    )}
                                    {containerInfo.HostConfig.NanoCpus && (
                                        <p>
                                            CPU:{' '}
                                            {(
                                                containerInfo.HostConfig.NanoCpus / 1000000000
                                            ).toFixed(2)}{' '}
                                            cores
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Politique de restart */}
                        {containerInfo.HostConfig.RestartPolicy && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Politique de redémarrage</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm">
                                    {containerInfo.HostConfig.RestartPolicy.Name || 'Aucune'}
                                </CardContent>
                            </Card>
                        )}

                        {/* Dates */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Dates</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <p>
                                    Créé: {new Date(containerInfo.Created).toLocaleString('fr-FR')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ),
            });
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                toast.error('Impossible de récupérer les informations du conteneur');
            }
        }
    };

    const containerTools: ContainerTool[] = [
        { icon: Eye, label: 'Ouvrir', state: [] },
        {
            icon: Play,
            label: 'Démarrer',
            action: () => handleAction('start'),
            state: ['running', 'restarting', 'paused'],
        },
        {
            icon: Square,
            label: 'Arrêter',
            action: () => handleAction('stop'),
            state: ['exited', 'created', 'dead'],
        },
        {
            icon: Pause,
            label: 'Pause',
            action: () => handleAction('pause'),
            state: ['paused', 'exited', 'dead', 'created'],
        },
        {
            icon: RotateCw,
            label: 'Redémarrer',
            action: () => handleAction('restart'),
            state: ['created', 'dead'],
        },
        {
            icon: Info,
            label: 'Info',
            action: handleActionInfo,
            separator: true,
            state: [],
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                        onClick={tool.action}
                        disabled={tool.state?.includes(containerState)}>
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
