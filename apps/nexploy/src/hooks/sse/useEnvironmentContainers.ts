'use client';

import { useEffect, useState } from 'react';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import {
    Containers,
    ContainersEvent,
} from '@workspace/typescript-interface/docker/docker.containers';
import { useContainersStore } from '@/stores/docker/useContainersStore';

export function useEnvironmentContainers(environmentId?: string): {
    containers: Containers[];
    isLoading: boolean;
} {
    const globalContainers = useContainersStore((s) => s.containers);
    const [containers, setContainers] = useState<Containers[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!environmentId) return;

        setIsLoading(true);

        const params = { environment: environmentId };
        const unsubscribers: (() => void)[] = [];

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'containers',
                'initial-state',
                (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    setContainers(data.containers || []);
                    setIsLoading(false);
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'containers',
                'container-added',
                (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    if (!data.container || data.container.image?.startsWith('sha256:')) return;
                    setContainers((prev) => [...prev, data.container!]);
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'containers',
                'container-updated',
                (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    if (!data.container) return;
                    setContainers((prev) =>
                        prev.map((c) => (c.id === data.container!.id ? data.container! : c)),
                    );
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'containers',
                'container-removed',
                (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    if (!data.containerId) return;
                    setContainers((prev) => prev.filter((c) => c.id !== data.containerId));
                },
                params,
            ),
        );

        return () => {
            unsubscribers.forEach((fn) => fn());
            setIsLoading(false);
        };
    }, [environmentId]);

    if (!environmentId) {
        return { containers: globalContainers, isLoading: false };
    }

    return { containers, isLoading };
}
