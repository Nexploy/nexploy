'use client';

import { ContainerCard } from '@/components/docker/ContainerCard';
import { useContainerStore } from '@/stores/useContainerStore';
import { Badge } from '@workspace/ui/components/badge';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { Container as IconContainer } from 'lucide-react';
import { AddContainer } from '@/components/docker/AddContainer';

interface ContainersStandaloneProps {
    disableEmpty?: boolean;
}

export function ContainersStandalone({ disableEmpty = false }: ContainersStandaloneProps) {
    const standaloneContainers = useContainerStore((state) => state.getOrganizedContainers)()
        .standaloneContainers;

    if (standaloneContainers.length) {
        return (
            <div className={'space-y-3 px-6'}>
                <div className="flex items-center gap-2 px-1">
                    <span className="text-lg font-semibold">Conteneurs</span>
                    <Badge variant={'secondary'}>{standaloneContainers.length}</Badge>
                </div>
                <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`}>
                    {standaloneContainers.map((container, index) => (
                        <ContainerCard key={index} container={container} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        !disableEmpty && (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon" className={'bg-primary/10'}>
                        <IconContainer className="text-primary" />
                    </EmptyMedia>
                    <EmptyTitle>Aucun conteneur</EmptyTitle>
                    <EmptyDescription>Vous n’avez encore créé aucun conteneur.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <AddContainer />
                </EmptyContent>
            </Empty>
        )
    );
}
