import type {
    SwarmInfo,
    SwarmNode,
    SwarmNodeRole,
    SwarmService,
    SwarmTask,
    SwarmTaskState,
} from '../../docker/swarm';

export interface SwarmState {
    isSwarmActive: boolean;
    swarmInfo: SwarmInfo | null;
    nodes: SwarmNode[];
    services: SwarmService[];
    tasks: SwarmTask[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    setIsSwarmActive: (active: boolean) => void;
    setSwarmInfo: (info: SwarmInfo | null) => void;
    setNodes: (nodes: SwarmNode[]) => void;
    setServices: (services: SwarmService[]) => void;
    setTasks: (tasks: SwarmTask[]) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;

    addNode: (node: SwarmNode) => void;
    updateNode: (node: SwarmNode) => void;
    removeNode: (nodeId: string) => void;

    addService: (service: SwarmService) => void;
    updateService: (service: SwarmService) => void;
    removeService: (serviceId: string) => void;

    addTask: (task: SwarmTask) => void;
    updateTask: (task: SwarmTask) => void;
    removeTask: (taskId: string) => void;

    getNode: (id: string) => SwarmNode | undefined;
    getService: (id: string) => SwarmService | undefined;
    getTask: (id: string) => SwarmTask | undefined;
    getNodesByRole: (role: SwarmNodeRole) => SwarmNode[];
    getActiveNodes: () => SwarmNode[];
    getTasksByService: (serviceId: string) => SwarmTask[];
    getTasksByNode: (nodeId: string) => SwarmTask[];
    getTasksByState: (state: SwarmTaskState) => SwarmTask[];

    connect: () => void;
    disconnect: () => void;
}
