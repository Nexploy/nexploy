'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useDockerStore } from '@/stores/useDockerStore';

export function DockerSSEProvider({ children }: PropsWithChildren) {
    const connect = useDockerStore((state) => state.connect);
    const disconnect = useDockerStore((state) => state.disconnect);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return children;
}
