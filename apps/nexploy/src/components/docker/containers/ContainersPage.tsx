'use client';

import { Container as IconContainer, Container, Layers, LayoutGrid, Plus } from 'lucide-react';
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
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { ContainersStack } from '@/components/docker/containers/ContainersStack';
import { ContainersStandalone } from '@/components/docker/containers/ContainersStandalone';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';

export default function ContainersPage() {
    const lastUpdate = useContainersStore((state) => state.lastUpdate);
    const containers = useContainersStore((state) => state.containers);
    const stacksSize = useContainersStore((state) => state.getOrganizedContainers)().stacks.size;
    const standaloneContainersLenght = useContainersStore((state) => state.getOrganizedContainers)()
        .standaloneContainers.length;

    const numberOfStackAndStandaloneContainer = stacksSize + standaloneContainersLenght;

    const tabs = [
        {
            id: 'all',
            label: 'Tout',
            icon: LayoutGrid,
            count: numberOfStackAndStandaloneContainer,
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

    const isLoading = !containers.length && !lastUpdate;
    const isEmpty = !containers.length && !!lastUpdate;

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex justify-between gap-2 px-5">
                <div className={'flex gap-3'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Container className="text-primary size-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Docker Containers
                        </h1>
                        {isLoading ? (
                            <Skeleton className={'my-1 h-3 w-40'} />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                {standaloneContainersLenght} conteneur
                                {stacksSize > 0 && ` · ${stacksSize} stack`}
                            </p>
                        )}
                    </div>
                </div>
                <Button asChild>
                    <Link href={'/docker/containers/create-container'}>
                        <Plus />
                        Ajouter un conteneur
                    </Link>
                </Button>
            </div>

            {isLoading && (
                <div className="mb-6 flex flex-1 flex-col gap-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="mx-6 flex-1" />
                    ))}
                </div>
            )}

            {isEmpty && (
                <Empty className="mb-32">
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-primary/10">
                            <IconContainer className="text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>Aucun conteneur</EmptyTitle>
                        <EmptyDescription>
                            Vous n’avez encore créé aucun conteneur.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild>
                            <Link href={'/docker/containers/create-container'}>
                                <Plus />
                                Ajouter un conteneur
                            </Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            )}

            {!isLoading && !isEmpty && (
                <Tabs className="flex flex-1 flex-col overflow-hidden" defaultValue="all">
                    <TabsList className="mx-5 mb-2">
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.id} value={tab.id} className="flex flex-1 gap-2">
                                <div className="flex items-center gap-2">
                                    <tab.icon />
                                    <span>{tab.label}</span>
                                </div>
                                <Badge className="rounded-full" variant="secondary">
                                    {tab.count}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="pb-5">
                            <TabsContent value="all" className="flex flex-col space-y-4">
                                <ContainersStack />
                                <ContainersStandalone />
                            </TabsContent>
                            <TabsContent value="stacks">
                                <ContainersStack />
                            </TabsContent>
                            <TabsContent value="containers">
                                <ContainersStandalone keepEmpty />
                            </TabsContent>
                        </div>
                    </ScrollAreaWithShadow>
                </Tabs>
            )}
        </div>
    );
}
