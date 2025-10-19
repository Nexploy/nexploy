'use client';

import { useContainerStore } from '@/stores/useContainerStore';
import {
    AlertCircleIcon,
    Box,
    Container as IconContainer,
    Container,
    Layers,
    LayoutGrid,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { ScrollAreaWithShadow } from '@/components/docker/ScrollAreaWithShadow';
import { StatusDocker } from '@/components/docker/StatusDocker';
import { ContainersStandalone } from '@/components/docker/ContainersStandalone';
import { ContainersStack } from '@/components/docker/ContainersStack';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';
import { AddContainer } from '@/components/docker/AddContainer';

export default function DockerContainersPage() {
    const stacksSize = useContainerStore().getOrganizedContainers().stacks.size;
    const standaloneContainersLenght =
        useContainerStore().getOrganizedContainers().standaloneContainers.length;
    const error = useContainerStore((state) => state.error);

    const numberOfContainers = stacksSize + standaloneContainersLenght;

    const tabs = [
        {
            id: 'all',
            label: 'Tout',
            icon: LayoutGrid,
            count: numberOfContainers,
        },
        {
            id: 'stacks',
            label: 'Stacks',
            icon: Layers,
            count: stacksSize,
        },
        {
            id: 'containers',
            label: 'Conteneurs',
            icon: Container,
            count: standaloneContainersLenght,
        },
    ];

    return (
        <div className="flex h-full flex-col gap-6 pt-5">
            <div className="flex justify-between gap-4 px-6">
                <div className={'flex gap-2'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Box className="text-primary" />
                    </div>
                    <div>
                        <div className={'flex items-end gap-2'}>
                            <h1 className="text-3xl font-semibold leading-none tracking-tight">
                                Docker Containers
                            </h1>
                            <StatusDocker className={'mb-1'} />
                        </div>
                        {numberOfContainers > 0 && (
                            <p className="text-muted-foreground text-sm">
                                {numberOfContainers} conteneur
                                {stacksSize > 0 && ` · ${stacksSize} stack`}
                            </p>
                        )}
                    </div>
                </div>
                <AddContainer />
            </div>

            {error && (
                <Alert className={'mx-6 w-auto'} variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>{error.message}</AlertTitle>
                </Alert>
            )}

            {numberOfContainers === 0 ? (
                <Empty className={'mb-32'}>
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className={'bg-primary/10'}>
                            <IconContainer className="text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>Aucun conteneur</EmptyTitle>
                        <EmptyDescription>
                            Vous n’avez encore créé aucun conteneur.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <AddContainer />
                    </EmptyContent>
                </Empty>
            ) : (
                <Tabs className="flex flex-1 flex-col overflow-hidden" defaultValue="all">
                    <TabsList className={'mx-6 mb-2'}>
                        {tabs.map((tab, index) => (
                            <TabsTrigger key={index} value={tab.id} className={'flex flex-1 gap-2'}>
                                <div className={'flex items-center gap-2'}>
                                    <tab.icon />
                                    <span>{tab.label}</span>
                                </div>
                                <Badge className={'rounded-full'} variant={'secondary'}>
                                    {tab.count}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className={'pb-6'}>
                            <TabsContent value="all" className="flex flex-col gap-5">
                                <ContainersStack />
                                <ContainersStandalone />
                            </TabsContent>
                            <TabsContent className={'space-y-2'} value="stacks">
                                <ContainersStack />
                            </TabsContent>
                            <TabsContent value="containers">
                                <ContainersStandalone />
                            </TabsContent>
                        </div>
                    </ScrollAreaWithShadow>
                </Tabs>
            )}
        </div>
    );
}
