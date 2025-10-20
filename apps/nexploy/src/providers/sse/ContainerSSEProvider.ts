import { useContainerStore } from '@/stores/useContainerStore';
import { PropsWithChildren, useEffect } from 'react';

interface UseContainerSSEProps {
    containerIds?: string[];
}

export function ContainerSSEProvider({
    children,
    containerIds,
}: PropsWithChildren<UseContainerSSEProps>) {
    const connect = useContainerStore((state) => state.connect);
    const disconnect = useContainerStore((state) => state.disconnect);

    useEffect(() => {
        connect(containerIds);

        return () => {
            disconnect();
        };
    }, [connect, containerIds, disconnect]);

    return children;
}
