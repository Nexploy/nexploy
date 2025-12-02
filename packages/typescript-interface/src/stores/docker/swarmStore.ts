import { SwarmInfo, SwarmNode, SwarmService } from '../../docker/docker.swarm';

export interface SwarmState {
    swarmInfo: SwarmInfo | null;
    nodes: SwarmNode[];
    services: SwarmService[];
    isSwarmActive: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    setSwarmInfo: (info: SwarmInfo | null) => void;
    setNodes: (nodes: SwarmNode[]) => void;
    setServices: (services: SwarmService[]) => void;
    setIsSwarmActive: (active: boolean) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    addNode: (node: SwarmNode) => void;
    removeNode: (nodeId: string) => void;
    updateNode: (node: SwarmNode) => void;
    addService: (service: SwarmService) => void;
    removeService: (serviceId: string) => void;
    updateService: (service: SwarmService) => void;
    getNode: (id: string) => SwarmNode | undefined;
    getService: (id: string) => SwarmService | undefined;
    getNodesByRole: (role: 'manager' | 'worker') => SwarmNode[];
    getActiveNodes: () => SwarmNode[];
    connect: () => void;
    disconnect: () => void;
}
