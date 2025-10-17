import { ContainerInfo } from 'dockerode';
import { Button } from '@workspace/ui/components/button';
import { AlertCircleIcon, Box, Layers, LayoutGrid, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { StackGroup } from '@/components/docker/StackGroup';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle
} from '@workspace/ui/components/empty';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { ContainerCard } from '@/components/docker/ContainerCard';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollAreaWithShadow } from '@/components/docker/ScrollAreaWithShadow';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';


export default async function DockerPage() {
    let containers: ContainerInfo[] = [];
    let errorContainer: string | null = null;
    try {
        containers = await drinoDocker.get<ContainerInfo[]>('/containers').consume();
    } catch (error: any) {
        errorContainer = error.message;
    }

    const stacks = new Map<string, ContainerInfo[]>();
    const standaloneContainers: ContainerInfo[] = [];

    containers.forEach((container) => {
        const projectLabel = container.Labels?.['com.docker.compose.project'];
        if (projectLabel) {
            if (!stacks.has(projectLabel)) {
                stacks.set(projectLabel, []);
            }
            stacks.get(projectLabel)!.push(container);
        } else {
            standaloneContainers.push(container);
        }
    });

    const tabs = [
        {
            id: 'all',
            label: 'Tout',
            icon: LayoutGrid,
            count: containers.length,
        },
        {
            id: 'stacks',
            label: 'Stacks',
            icon: Layers,
            count: stacks.size,
        },
        {
            id: 'containers',
            label: 'Conteneurs',
            icon: Box,
            count: standaloneContainers.length,
        },
    ];

    return (
        <div className="flex flex-col gap-6 h-full pt-6">
            <div className="flex justify-between gap-4 px-6">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Conteneurs Docker</h1>
                    <p className="text-sm text-muted-foreground">
                        {containers.length} conteneur
                        {stacks.size > 0 && ` · ${stacks.size} stack`}
                    </p>
                </div>
                <Button>
                    <Plus/>
                    Ajouter un conteneur
                </Button>
            </div>

            {errorContainer && (
                <Alert className={'mx-6 w-auto'} variant="destructive">
                    <AlertCircleIcon/>
                    <AlertTitle>{errorContainer}</AlertTitle>
                </Alert>
            )}

            <Tabs className="flex flex-1 flex-col overflow-hidden" defaultValue="all">
                <TabsList className={'mx-6'}>
                    {tabs.map((tab, index) => (
                        <TabsTrigger key={index} value={tab.id} className={'flex flex-1 gap-2'}>
                            <div className={'flex items-center gap-2'}>
                                <tab.icon/>
                                <span>{tab.label}</span>
                            </div>
                            <Badge className={'rounded-full'} variant={'secondary'}>{tab.count}</Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>
                {containers.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Box/>
                            </EmptyMedia>
                            <EmptyTitle>Aucun conteneur</EmptyTitle>
                            <EmptyDescription>
                                Vous n’avez encore créé aucun conteneur.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button>
                                <Plus/>
                                Ajouter un conteneur
                            </Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <ScrollAreaWithShadow className="h-full overflow-hidden px-6">
                        <div className={'pb-6'}>
                            <TabsContent value="all" className="space-y-3">
                                <div className="space-y-3">
                                    {Array.from(stacks.entries()).map(([stackName, stackContainers]) => (
                                        <StackGroup
                                            key={stackName}
                                            stackName={stackName}
                                            containers={stackContainers}
                                        />
                                    ))}
                                </div>
                                {stacks.size > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <Box size={18} className="text-gray-600"/>
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Conteneurs individuels
                                            </h2>
                                            <span className="text-sm text-gray-500">
                                                ({standaloneContainers.length})
                                            </span>
                                        </div>
                                        <div
                                            className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pl-7`}>
                                            {standaloneContainers.map((container) => (
                                                <ContainerCard key={container.Id} container={container}/>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="stacks">
                                <div className="space-y-3">
                                    {Array.from(stacks.entries()).map(([stackName, stackContainers]) => (
                                        <StackGroup
                                            key={stackName}
                                            stackName={stackName}
                                            containers={stackContainers}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="containers">
                                <div className="space-y-3">
                                    {stacks.size > 0 && (
                                        <div className="flex items-center gap-2 px-1">
                                            <Box size={18} className="text-gray-600"/>
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Conteneurs individuels
                                            </h2>
                                            <span className="text-sm text-gray-500">
                                                ({standaloneContainers.length})
                                            </span>
                                        </div>
                                    )}
                                    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pl-7`}>
                                        {standaloneContainers.map((container) => (
                                            <ContainerCard key={container.Id} container={container}/>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </Tabs>
        </div>
    )
        ;
}
