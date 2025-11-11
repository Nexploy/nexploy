'use client';

import { PropsWithChildren, useEffect, useMemo } from 'react';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useImageStore } from '@/stores/docker/useImageStore';
import { useDockerStore } from '@/stores/docker/useDockerStore';
import { useEventsStore } from '@/stores/docker/useEventsStore';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { useContainerLogsStore } from '@/stores/docker/useContainerLogsStore';
import { SSEChannel } from '@workspace/typescript-interface/sse';
import { useContainerStatsStore } from '@/stores/docker/useContainerStatsStore';

type ExtractConnectParams<T> = T extends (params: infer P) => void ? P : never;

type SSEParams = {
    docker?: ExtractConnectParams<ReturnType<typeof useDockerStore.getState>['connect']>;
    containers?: ExtractConnectParams<ReturnType<typeof useContainersStore.getState>['connect']>;
    images?: ExtractConnectParams<ReturnType<typeof useImageStore.getState>['connect']>;
    volumes?: ExtractConnectParams<ReturnType<typeof useVolumeStore.getState>['connect']>;
    networks?: ExtractConnectParams<ReturnType<typeof useNetworkStore.getState>['connect']>;
    events?: ExtractConnectParams<ReturnType<typeof useEventsStore.getState>['connect']>;
    container?: ExtractConnectParams<ReturnType<typeof useContainerStore.getState>['connect']>;
    logs?: ExtractConnectParams<ReturnType<typeof useContainerLogsStore.getState>['connect']>;
    stats?: ExtractConnectParams<ReturnType<typeof useContainerStatsStore.getState>['connect']>;
};

interface SSEProviderProps extends PropsWithChildren {
    connections?: SSEChannel[];
    params?: SSEParams;
}

export function SSEProvider({
    children,
    connections = ['docker', 'containers', 'images', 'volumes', 'networks', 'events'],
    params = {},
}: SSEProviderProps) {
    const memoizedConnections = useMemo(() => connections, [JSON.stringify(connections)]);
    const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);

    const containersConnect = useContainersStore((s) => s.connect);
    const containersDisconnect = useContainersStore((s) => s.disconnect);

    const imageConnect = useImageStore((s) => s.connect);
    const imageDisconnect = useImageStore((s) => s.disconnect);

    const dockerConnect = useDockerStore((s) => s.connect);
    const dockerDisconnect = useDockerStore((s) => s.disconnect);

    const eventsConnect = useEventsStore((s) => s.connect);
    const eventsDisconnect = useEventsStore((s) => s.disconnect);

    const volumesConnect = useVolumeStore((s) => s.connect);
    const volumesDisconnect = useVolumeStore((s) => s.disconnect);

    const networksConnect = useNetworkStore((s) => s.connect);
    const networksDisconnect = useNetworkStore((s) => s.disconnect);

    const containerConnect = useContainerStore((s) => s.connect);
    const containerDisconnect = useContainerStore((s) => s.disconnect);

    const containerLogsConnect = useContainerLogsStore((s) => s.connect);
    const containerLogsDisconnect = useContainerLogsStore((s) => s.disconnect);

    const containerStatsConnect = useContainerStatsStore((s) => s.connect);
    const containerStatsDisconnect = useContainerStatsStore((s) => s.disconnect);

    useEffect(() => {
        const connectFns: Record<SSEChannel, (...args: any[]) => void> = {
            containers: containersConnect,
            container: containerConnect,
            stats: containerStatsConnect,
            logs: containerLogsConnect,
            images: imageConnect,
            docker: dockerConnect,
            events: eventsConnect,
            volumes: volumesConnect,
            networks: networksConnect,
        };

        const disconnectFns: Record<SSEChannel, (...args: any[]) => void> = {
            containers: containersDisconnect,
            container: containerDisconnect,
            logs: containerLogsDisconnect,
            stats: containerStatsDisconnect,
            images: imageDisconnect,
            docker: dockerDisconnect,
            events: eventsDisconnect,
            volumes: volumesDisconnect,
            networks: networksDisconnect,
        };

        memoizedConnections.forEach((conn) => {
            const param = memoizedParams[conn as keyof SSEParams];
            if (param !== undefined) connectFns[conn]?.(param);
            else connectFns[conn]?.();
        });

        return () => {
            memoizedConnections.forEach((conn) => {
                const param = memoizedParams[conn as keyof SSEParams];
                if (param !== undefined) disconnectFns[conn]?.(param);
                else disconnectFns[conn]?.();
            });
        };
    }, [
        memoizedParams,
        memoizedConnections,
        containerConnect,
        containerDisconnect,
        containersConnect,
        containersDisconnect,
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
        containerLogsConnect,
        containerLogsDisconnect,
        containerStatsConnect,
        containerStatsDisconnect,
    ]);

    return children;
}
