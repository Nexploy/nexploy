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
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { useRequestsStore } from '@/stores/traefik/useRequestsStore';
import { useMonitoringStore } from '@/stores/monitoring/useMonitoringStore';

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
    swarm?: ExtractConnectParams<ReturnType<typeof useSwarmStore.getState>['connect']>;
    traefik?: ExtractConnectParams<ReturnType<typeof useRequestsStore.getState>['connect']>;
    monitoring?: ExtractConnectParams<ReturnType<typeof useMonitoringStore.getState>['connect']>;
};

interface SSEProviderProps extends PropsWithChildren {
    connections?: SSEChannel[];
    params?: SSEParams;
}

const DEFAULT_SSE_CONNECTIONS: SSEChannel[] = [
    'docker',
    'containers',
    'images',
    'volumes',
    'networks',
    'events',
];
const DEFAULT_SSE_PARAMS: SSEParams = {};

export function SSEProvider({
    children,
    connections = DEFAULT_SSE_CONNECTIONS,
    params = DEFAULT_SSE_PARAMS,
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

    const swarmConnect = useSwarmStore((s) => s.connect);
    const swarmDisconnect = useSwarmStore((s) => s.disconnect);

    const traefikConnect = useRequestsStore((s) => s.connect);
    const traefikDisconnect = useRequestsStore((s) => s.disconnect);

    const monitoringConnect = useMonitoringStore((s) => s.connect);
    const monitoringDisconnect = useMonitoringStore((s) => s.disconnect);

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
            swarm: swarmConnect,
            traefik: traefikConnect,
            monitoring: monitoringConnect,
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
            swarm: swarmDisconnect,
            traefik: traefikDisconnect,
            monitoring: monitoringDisconnect,
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
    }, [memoizedParams, memoizedConnections]);

    return children;
}
