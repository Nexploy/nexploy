export interface SwarmNode {
    id: string;
    hostname: string;
    status: SwarmNodeStatus;
    availability: SwarmNodeAvailability;
    role: 'manager' | 'worker';
    address: string;
    engineVersion: string;
    labels: Record<string, string>;
    managerStatus?: {
        leader: boolean;
        reachability: string;
        addr: string;
    };
    resources: {
        nanoCPUs: number;
        memoryBytes: number;
    };
    createdAt: number;
    updatedAt: number;
    timestamp: number;
}

export type SwarmNodeStatus = 'ready' | 'down' | 'unknown' | 'disconnected';
export type SwarmNodeAvailability = 'active' | 'pause' | 'drain';

export interface SwarmService {
    id: string;
    name: string;
    mode: 'replicated' | 'global';
    replicas: number;
    runningReplicas: number;
    image: string;
    ports: SwarmServicePort[];
    labels: Record<string, string>;
    createdAt: number;
    updatedAt: number;
    timestamp: number;
}

export interface SwarmServicePort {
    protocol: 'tcp' | 'udp';
    targetPort: number;
    publishedPort: number;
    publishMode: 'ingress' | 'host';
}

export interface SwarmTask {
    id: string;
    serviceId: string;
    nodeId: string;
    status: SwarmTaskStatus;
    desiredState: string;
    containerStatus?: {
        containerId: string;
        pid: number;
        exitCode?: number;
    };
    createdAt: number;
    timestamp: number;
}

export type SwarmTaskStatus =
    | 'new'
    | 'pending'
    | 'assigned'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'starting'
    | 'running'
    | 'complete'
    | 'shutdown'
    | 'failed'
    | 'rejected'
    | 'remove'
    | 'orphaned';

export interface SwarmInfo {
    id: string;
    createdAt: number;
    updatedAt: number;
    joinTokens: {
        worker: string;
        manager: string;
    };
    managerNodes: number;
    workerNodes: number;
    isManager: boolean;
    localNodeId: string;
    timestamp: number;
}

export type SwarmAction =
    | 'init'
    | 'join'
    | 'leave'
    | 'update'
    | 'node-update'
    | 'service-create'
    | 'service-update'
    | 'service-remove';

export interface SwarmEvent {
    type:
        | 'initial'
        | 'node-added'
        | 'node-updated'
        | 'node-removed'
        | 'service-added'
        | 'service-updated'
        | 'service-removed'
        | 'swarm-updated'
        | 'heartbeat'
        | 'not-in-swarm';
    swarmInfo?: SwarmInfo;
    nodes?: SwarmNode[];
    services?: SwarmService[];
    node?: SwarmNode;
    service?: SwarmService;
    nodeId?: string;
    serviceId?: string;
    oldState?: SwarmNode | SwarmService;
    timestamp: number;
}

export interface SwarmManagerStats {
    nodeCount: number;
    serviceCount: number;
    eventStreamActive: boolean;
    reconnectAttempts: number;
    polling: boolean;
    isSwarmActive: boolean;
}
