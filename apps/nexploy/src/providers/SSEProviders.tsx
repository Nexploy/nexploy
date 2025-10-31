'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { useImageStore } from '@/stores/docker/useImageStore';
import { useDockerStore } from '@/stores/docker/useDockerStore';
import { useEventsStore } from '@/stores/docker/useEventsStore';

export function SSEProvider({ children }: PropsWithChildren) {
    const containerConnect = useContainerStore((state) => state.connect);
    const containerDisconnect = useContainerStore((state) => state.disconnect);

    const imageConnect = useImageStore((state) => state.connect);
    const imageDisconnect = useImageStore((state) => state.disconnect);

    const dockerConnect = useDockerStore((state) => state.connect);
    const dockerDisconnect = useDockerStore((state) => state.disconnect);

    const eventsConnect = useEventsStore((state) => state.connect);
    const eventsDisconnect = useEventsStore((state) => state.disconnect);

    useEffect(() => {
        containerConnect();
        imageConnect();
        dockerConnect();
        eventsConnect();

        return () => {
            containerDisconnect();
            imageDisconnect();
            dockerDisconnect();
            eventsDisconnect();
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
    ]);

    return children;
}
