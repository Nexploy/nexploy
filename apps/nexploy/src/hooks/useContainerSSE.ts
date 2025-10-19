import { useContainerStore } from '@/stores/useContainerStore';
import { useEffect } from 'react';

export function useContainerSSE(apiUrl: string, containerIds?: string[]) {
    const connect = useContainerStore((state) => state.connect);
    const disconnect = useContainerStore((state) => state.disconnect);

    useEffect(() => {
        connect(apiUrl, containerIds);

        return () => {
            disconnect();
        };
    }, [apiUrl, containerIds?.join(','), connect, disconnect]);
}
