export interface SwarmInfo {
    id: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    joinTokens: SwarmJoinTokens;
    totalNodes: number;
    managerNodes: number;
    workerNodes: number;
    isManager: boolean;
    localNodeId: string;
    dataPathPort: number;
}

export interface SwarmJoinTokens {
    worker: string;
    manager: string;
}

export interface SwarmNode {
    id: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    hostname: string;
    role: SwarmNodeRole;
    availability: SwarmNodeAvailability;
    state: SwarmNodeState;
    address: string;
    engineVersion: string;
    platform: SwarmNodePlatform;
    resources: SwarmNodeResources;
    labels: Record<string, string>;
    managerStatus?: SwarmManagerStatus;
}

export interface SwarmNodePlatform {
    architecture: string;
    os: string;
}

export interface SwarmNodeResources {
    nanoCPUs: number;
    memoryBytes: number;
}

export interface SwarmManagerStatus {
    leader: boolean;
    reachability: SwarmManagerReachability;
    addr: string;
}

export type SwarmNodeRole = 'manager' | 'worker';
export type SwarmNodeAvailability = 'active' | 'pause' | 'drain';
export type SwarmNodeState = 'unknown' | 'down' | 'ready' | 'disconnected';
export type SwarmManagerReachability = 'unknown' | 'unreachable' | 'reachable';

export interface SwarmService {
    id: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    name: string;
    mode: SwarmServiceMode;
    replicas: number;
    runningReplicas: number;
    image: string;
    ports: SwarmServicePort[];
    labels: Record<string, string>;
    env: string[];
    constraints: string[];
    networks: string[];
    updateStatus?: SwarmUpdateStatus;
    previousSpec?: boolean;
}

export interface SwarmServicePort {
    protocol: 'tcp' | 'udp' | 'sctp';
    targetPort: number;
    publishedPort: number;
    publishMode: 'ingress' | 'host';
}

export interface SwarmUpdateStatus {
    state: SwarmUpdateState;
    startedAt?: number;
    completedAt?: number;
    message?: string;
}

export type SwarmServiceMode = 'replicated' | 'global' | 'replicated-job' | 'global-job';
export type SwarmUpdateState =
    | 'updating'
    | 'paused'
    | 'completed'
    | 'rollback_started'
    | 'rollback_paused'
    | 'rollback_completed';

export interface SwarmTask {
    id: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    serviceId: string;
    serviceName: string;
    nodeId?: string;
    nodeHostname?: string;
    slot?: number;
    state: SwarmTaskState;
    desiredState: SwarmTaskDesiredState;
    message?: string;
    error?: string;
    containerStatus?: SwarmContainerStatus;
    image: string;
}

export interface SwarmContainerStatus {
    containerId?: string;
    pid?: number;
    exitCode?: number;
}

export type SwarmTaskState =
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

export type SwarmTaskDesiredState = 'running' | 'shutdown' | 'accepted';

export interface SwarmStats {
    isSwarmActive: boolean;
    totalNodes: number;
    managerNodes: number;
    workerNodes: number;
    healthyNodes: number;
    totalServices: number;
    totalTasks: number;
    runningTasks: number;
    pendingTasks: number;
    failedTasks: number;
}
