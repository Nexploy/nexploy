'use client'

import { ContainerCard } from '@/components/docker/ContainerCard';
import { useContainerState } from '@/hooks/useContainerState';

export function Containers() {
    const { containers, isConnected, error, lastUpdate, getContainersByState } =
        useContainerState('http://localhost:3300')

    return (
        <div className="space-y-2">
            {/*{stacks.size > 0 && (*/}
            {/*    <div className="flex items-center gap-2 px-1">*/}
            {/*        <span className="text-lg font-semibold">Conteneurs individuels</span>*/}
            {/*        <Badge variant={'secondary'}>{standaloneContainers.length}</Badge>*/}
            {/*    </div>*/}
            {/*)}*/}
            <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`}>
                {containers.map((container, index) => (
                    <ContainerCard key={index} container={container}/>
                ))}
            </div>
        </div>
    )
}
