import type { SwarmNode, SwarmTask } from '../../docker/swarm/swarm.types';

export interface NodeDetailState {
    nodeId: string | null;
    node: SwarmNode | null;
    tasks: SwarmTask[];
    notFound: boolean;
    isConnecting: boolean;
    isMonitoring: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    connect: (params: { nodeId: string }) => void;
    disconnect: () => void;
}
