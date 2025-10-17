import { Fragment, startTransition } from 'react';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, } from '@workspace/ui/components/dropdown-menu';
import { ContainerState, ContainerTool, DockerAction, } from '@workspace/typescript-interface/docker';
import { toast } from 'sonner';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import {
    Activity,
    Eye,
    HardDrive,
    Info,
    Layers,
    LayoutGrid,
    Network,
    Pause,
    Play,
    RotateCw,
    Settings,
    Square,
    TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSheetStore } from '@/stores/useSheetStore';
import { ContainerInspectInfo } from 'dockerode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@workspace/ui/components/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

interface ContainerDropdownActionsProps {
    containerId: string;
    containerName: string;
    containerState: ContainerState;
}

const messageAction: Record<DockerAction, string> = {
    start: 'démarre',
    stop: 's\'arrête',
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
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                toast.dismiss()
                toast.error(err.error.message);
            }
        } finally {
            startTransition(() => {
                router.refresh();
            });
        }
    }

    const handleActionInfo = async () => {
        try {
            const containerInfo = await drinoDocker
                .get<ContainerInspectInfo>(`/containers/${containerId}/info`)
                .consume();

            const networkData = generateNetworkData();
            openSheet({
                title: `Informations - ${containerName}`,
                description: `ID: ${containerId.substring(0, 12)}...`,
                content: (
                    <ScrollArea className="h-[calc(100vh-8rem)] px-1">
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="grid w-full grid-cols-5 mb-6">
                                <TabsTrigger value="all" className="text-xs">
                                    <LayoutGrid className="h-3 w-3 mr-1.5"/>
                                    Tout
                                </TabsTrigger>
                                <TabsTrigger value="image" className="text-xs">
                                    <Layers className="h-3 w-3 mr-1.5"/>
                                    Image
                                </TabsTrigger>
                                <TabsTrigger value="network" className="text-xs">
                                    <Network className="h-3 w-3 mr-1.5"/>
                                    Réseau
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="text-xs">
                                    <Settings className="h-3 w-3 mr-1.5"/>
                                    Ressources
                                </TabsTrigger>
                                <TabsTrigger value="volumes" className="text-xs">
                                    <HardDrive className="h-3 w-3 mr-1.5"/>
                                    Volumes
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="space-y-6 mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                <Activity className="text-muted-foreground h-4 w-4"/>
                                                État
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">
                                            Status
                                        </span>
                                                <Badge
                                                    variant={
                                                        containerInfo.State.Running
                                                            ? 'default'
                                                            : 'secondary'
                                                    }>
                                                    {containerInfo.State.Status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">
                                            Running
                                        </span>
                                                <Badge
                                                    variant={
                                                        containerInfo.State.Running
                                                            ? 'default'
                                                            : 'destructive'
                                                    }>
                                                    {containerInfo.State.Running ? 'Oui' : 'Non'}
                                                </Badge>
                                            </div>
                                            {containerInfo.State.Paused && (
                                                <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-sm">
                                                Paused
                                            </span>
                                                    <Badge variant="secondary">Oui</Badge>
                                                </div>
                                            )}
                                            {containerInfo.State.StartedAt && (
                                                <div className="flex flex-col gap-1 border-t pt-2">
                                            <span className="text-muted-foreground text-xs">
                                                Démarré
                                            </span>
                                                    <span className="font-mono text-sm">
                                                {new Date(
                                                    containerInfo.State.StartedAt,
                                                ).toLocaleString('fr-FR')}
                                            </span>
                                                </div>
                                            )}
                                            {containerInfo.State.Error && (
                                                <div className="border-t pt-2">
                                                    <p className="text-destructive text-sm font-medium">
                                                        Erreur
                                                    </p>
                                                    <p className="text-destructive/80 mt-1 text-xs">
                                                        {containerInfo.State.Error}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium">Image</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="break-all font-mono text-sm">
                                                {containerInfo.Image}
                                            </p>
                                            <Separator className="my-3"/>
                                            <div className="space-y-2">
                                                <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground text-xs">
                                                Créé
                                            </span>
                                                    <span className="font-mono text-sm">
                                                {new Date(containerInfo.Created).toLocaleString(
                                                    'fr-FR',
                                                )}
                                            </span>
                                                </div>
                                                {containerInfo.HostConfig.RestartPolicy && (
                                                    <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground text-xs">
                                                    Politique de redémarrage
                                                </span>
                                                        <Badge variant="outline" className="w-fit">
                                                            {containerInfo.HostConfig.RestartPolicy.Name ||
                                                                'Aucune'}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                            <Network className="text-muted-foreground h-4 w-4"/>
                                            Réseau
                                        </CardTitle>
                                        <CardDescription>
                                            Configuration réseau et statistiques de trafic
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {containerInfo.NetworkSettings.IPAddress && (
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground text-xs">
                                                        Adresse IP
                                                    </p>
                                                    <p className="font-mono text-sm">
                                                        {containerInfo.NetworkSettings.IPAddress}
                                                    </p>
                                                </div>
                                            )}
                                            {containerInfo.NetworkSettings.Gateway && (
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground text-xs">
                                                        Passerelle
                                                    </p>
                                                    <p className="font-mono text-sm">
                                                        {containerInfo.NetworkSettings.Gateway}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {Object.keys(containerInfo.NetworkSettings.Ports || {}).length >
                                            0 && (
                                                <div className="space-y-2">
                                                    <Separator/>
                                                    <p className="text-muted-foreground text-xs font-medium">
                                                        Mappings de ports
                                                    </p>
                                                    <div className="space-y-2">
                                                        {Object.entries(
                                                            containerInfo.NetworkSettings.Ports,
                                                        ).map(([port, bindings]) => (
                                                            <div
                                                                key={port}
                                                                className="bg-muted/30 flex items-center justify-between rounded-md px-3 py-2">
                                                    <span className="font-mono text-sm">
                                                        {port}
                                                    </span>
                                                                <span className="text-muted-foreground text-xs">
                                                        →
                                                    </span>
                                                                <span className="font-mono text-sm">
                                                        {bindings
                                                            ? bindings
                                                                .map(
                                                                    (b) =>
                                                                        `${b.HostIp || '*'}:${b.HostPort}`,
                                                                )
                                                                .join(', ')
                                                            : 'non mappé'}
                                                    </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        <div className="space-y-2">
                                            <Separator/>
                                            <div className="flex items-center justify-between">
                                                <p className="text-muted-foreground text-xs font-medium">
                                                    Trafic réseau
                                                </p>
                                                <TrendingUp className="text-muted-foreground h-3 w-3"/>
                                            </div>
                                            <ChartContainer
                                                config={{
                                                    rx: {
                                                        label: 'Réception (KB/s)',
                                                        color: 'hsl(var(--chart-1))',
                                                    },
                                                    tx: {
                                                        label: 'Transmission (KB/s)',
                                                        color: 'hsl(var(--chart-2))',
                                                    },
                                                }}
                                                className="h-[200px] w-full">
                                                <AreaChart data={networkData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                                    <XAxis
                                                        dataKey="time"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        tickFormatter={(value) => value}
                                                    />
                                                    <YAxis
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        tickFormatter={(value) => `${value}`}
                                                    />
                                                    <ChartTooltip content={<ChartTooltipContent/>}/>
                                                    <Area
                                                        type="monotone"
                                                        dataKey="rx"
                                                        stackId="1"
                                                        stroke="hsl(var(--chart-1))"
                                                        fill="hsl(var(--chart-1))"
                                                        fillOpacity={0.4}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="tx"
                                                        stackId="2"
                                                        stroke="hsl(var(--chart-2))"
                                                        fill="hsl(var(--chart-2))"
                                                        fillOpacity={0.4}
                                                    />
                                                </AreaChart>
                                            </ChartContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {(containerInfo.HostConfig.Memory || containerInfo.HostConfig.NanoCpus) && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">
                                                Ressources allouées
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {containerInfo.HostConfig.Memory && (
                                                    <div className="space-y-2">
                                                        <p className="text-muted-foreground text-xs">
                                                            Limite mémoire
                                                        </p>
                                                        <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold">
                                                        {(
                                                            containerInfo.HostConfig.Memory /
                                                            1024 /
                                                            1024
                                                        ).toFixed(0)}
                                                    </span>
                                                            <span className="text-muted-foreground text-sm">
                                                        MB
                                                    </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {containerInfo.HostConfig.NanoCpus && (
                                                    <div className="space-y-2">
                                                        <p className="text-muted-foreground text-xs">
                                                            Limite CPU
                                                        </p>
                                                        <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold">
                                                        {(
                                                            containerInfo.HostConfig.NanoCpus /
                                                            1000000000
                                                        ).toFixed(2)}
                                                    </span>
                                                            <span className="text-muted-foreground text-sm">
                                                        cores
                                                    </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {containerInfo.Config.Env.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">
                                                Variables d'environnement
                                            </CardTitle>
                                            <CardDescription>
                                                {containerInfo.Config.Env.length} variables définies
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className="bg-muted/30 max-h-60 space-y-1 overflow-y-auto rounded-md p-3 font-mono text-xs">
                                                {containerInfo.Config.Env.map((env, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="border-border/40 break-all border-b py-1 last:border-0">
                                                        {env}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {containerInfo.Mounts.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">
                                                Volumes montés
                                            </CardTitle>
                                            <CardDescription>
                                                {containerInfo.Mounts.length} volumes
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {containerInfo.Mounts.map((mount, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-muted/20 space-y-2 rounded-lg border p-3">
                                                    <div className="break-all font-mono text-xs">
                                                        <span className="text-muted-foreground">
                                                            Source:
                                                        </span>{' '}
                                                        {mount.Source}
                                                    </div>
                                                    <div className="break-all font-mono text-xs">
                                                        <span className="text-muted-foreground">
                                                            Destination:
                                                        </span>{' '}
                                                        {mount.Destination}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {mount.Type}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {mount.Mode}
                                                        </Badge>
                                                        {mount.RW === false && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Read-only
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>
                ),
            })

        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                toast.error(err.error.message);
            }
        }
    }

    const generateNetworkData = () => {
        const data = [];
        const now = Date.now();
        for (let i = 11; i >= 0; i--) {
            data.push({
                time: `-${i}s`,
                rx: Math.floor(Math.random() * 100 + 20),
                tx: Math.floor(Math.random() * 80 + 10),
            });
        }
        return data;
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
            state: ['created', 'dead'],
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
                    {tool.separator && <DropdownMenuSeparator/>}
                    <DropdownMenuItem
                        onClick={tool.action}
                        disabled={tool.state?.includes(containerState)}>
                        <tool.icon/>
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
