'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useContainerStore } from '@/stores/useContainerStore';
import { useImageStore } from '@/stores/useImageStore';
import { useDockerStore } from '@/stores/useDockerStore';

export function SSEProvider({ children }: PropsWithChildren) {
    const containerConnect = useContainerStore((state) => state.connect);
    const containerDisconnect = useContainerStore((state) => state.disconnect);

    const imageConnect = useImageStore((state) => state.connect);
    const imageDisconnect = useImageStore((state) => state.disconnect);

    const dockerConnect = useDockerStore((state) => state.connect);
    const dockerDisconnect = useDockerStore((state) => state.disconnect);

    useEffect(() => {
        containerConnect();
        imageConnect();
        dockerConnect();

        return () => {
            containerDisconnect();
            imageDisconnect();
            dockerDisconnect();
        };
    }, [
        containerConnect,
        containerDisconnect,
        dockerConnect,
        dockerDisconnect,
        imageConnect,
        imageDisconnect,
    ]);

    return children;
}
