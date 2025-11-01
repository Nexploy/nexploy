'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { useImageStore } from '@/stores/docker/useImageStore';
import { useDockerStore } from '@/stores/docker/useDockerStore';
import { useEventsStore } from '@/stores/docker/useEventsStore';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';

type SSEConnection = 'docker' | 'containers' | 'images' | 'volumes' | 'networks' | 'events';

interface SSEProviderProps extends PropsWithChildren {
    connections?: SSEConnection[];
}

export function SSEProvider({
    children,
    connections = ['docker', 'containers', 'images', 'volumes', 'networks', 'events'],
}: SSEProviderProps) {
    const containerConnect = useContainerStore((state) => state.connect);
    const containerDisconnect = useContainerStore((state) => state.disconnect);

    const imageConnect = useImageStore((state) => state.connect);
    const imageDisconnect = useImageStore((state) => state.disconnect);

    const dockerConnect = useDockerStore((state) => state.connect);
    const dockerDisconnect = useDockerStore((state) => state.disconnect);

    const eventsConnect = useEventsStore((state) => state.connect);
    const eventsDisconnect = useEventsStore((state) => state.disconnect);

    const volumesConnect = useVolumeStore((state) => state.connect);
    const volumesDisconnect = useVolumeStore((state) => state.disconnect);

    const networksConnect = useNetworkStore((state) => state.connect);
    const networksDisconnect = useNetworkStore((state) => state.disconnect);

    useEffect(() => {
        const connectFns: Record<SSEConnection, () => void> = {
            containers: containerConnect,
            images: imageConnect,
            docker: dockerConnect,
            events: eventsConnect,
            volumes: volumesConnect,
            networks: networksConnect,
        };

        const disconnectFns: Record<SSEConnection, () => void> = {
            containers: containerDisconnect,
            images: imageDisconnect,
            docker: dockerDisconnect,
            events: eventsDisconnect,
            volumes: volumesDisconnect,
            networks: networksDisconnect,
        };

        connections.forEach((conn) => {
            connectFns[conn]?.();
        });

        return () => {
            connections.forEach((conn) => {
                disconnectFns[conn]?.();
            });
        };
    }, [
        containerConnect,
        containerDisconnect,
        dockerConnect,
        dockerDisconnect,
        eventsConnect,
        eventsDisconnect,
        imageConnect,
        imageDisconnect,
        networksConnect,
        networksDisconnect,
        volumesConnect,
        volumesDisconnect,
    ]);

    return children;
}
