import type {
    SwarmInfo,
    SwarmNode,
    SwarmService,
    SwarmTask,
    SwarmNodeRole,
    SwarmTaskState,
} from '../../docker/swarm/swarm.types';

export interface SwarmState {
    // State
    isSwarmActive: boolean;
    swarmInfo: SwarmInfo | null;
    nodes: SwarmNode[];
    services: SwarmService[];
    tasks: SwarmTask[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    // Setters
    setIsSwarmActive: (active: boolean) => void;
    setSwarmInfo: (info: SwarmInfo | null) => void;
    setNodes: (nodes: SwarmNode[]) => void;
    setServices: (services: SwarmService[]) => void;
    setTasks: (tasks: SwarmTask[]) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;

    // Node mutations
    addNode: (node: SwarmNode) => void;
    updateNode: (node: SwarmNode) => void;
    removeNode: (nodeId: string) => void;

    // Service mutations
    addService: (service: SwarmService) => void;
    updateService: (service: SwarmService) => void;
    removeService: (serviceId: string) => void;

    // Task mutations
    addTask: (task: SwarmTask) => void;
    updateTask: (task: SwarmTask) => void;
    removeTask: (taskId: string) => void;

    // Selectors
    getNode: (id: string) => SwarmNode | undefined;
    getService: (id: string) => SwarmService | undefined;
    getTask: (id: string) => SwarmTask | undefined;
    getNodesByRole: (role: SwarmNodeRole) => SwarmNode[];
    getActiveNodes: () => SwarmNode[];
    getTasksByService: (serviceId: string) => SwarmTask[];
    getTasksByNode: (nodeId: string) => SwarmTask[];
    getTasksByState: (state: SwarmTaskState) => SwarmTask[];

    // Connection
    connect: () => void;
    disconnect: () => void;
}
