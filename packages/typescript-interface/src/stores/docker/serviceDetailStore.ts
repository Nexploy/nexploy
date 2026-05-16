import type { SwarmService, SwarmTask } from '../../docker/swarm';

export interface ServiceDetailState {
    serviceId: string | null;
    service: SwarmService | null;
    tasks: SwarmTask[];
    notFound: boolean;
    isConnecting: boolean;
    isMonitoring: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    connect: (params: { serviceId: string }) => void;
    disconnect: () => void;
}
