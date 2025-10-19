'use client';

import { ContainerCard } from '@/components/docker/ContainerCard';
import { useContainerStore } from '@/stores/useContainerStore';
import { Badge } from '@workspace/ui/components/badge';

export function ContainersStandalone() {
    const getOrganizedContainers = useContainerStore((state) => state.getOrganizedContainers);

    return (
        <div className="space-y-2 px-6">
            <div className="flex items-center gap-2 px-1">
                <span className="text-lg font-semibold">Conteneurs</span>
                <Badge variant={'secondary'}>
                    {getOrganizedContainers().standaloneContainers.length}
                </Badge>
            </div>
            <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`}>
                {getOrganizedContainers().standaloneContainers.map((container, index) => (
                    <ContainerCard key={index} container={container} />
                ))}
            </div>
        </div>
    );
}
