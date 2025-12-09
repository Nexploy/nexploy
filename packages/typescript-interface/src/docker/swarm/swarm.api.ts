import type {
    SwarmInfo,
    SwarmNode,
    SwarmService,
    SwarmTask,
    SwarmNodeAvailability,
    SwarmNodeRole,
    SwarmTaskState,
    SwarmStats,
} from './swarm.types';

// ===== CLUSTER OPERATIONS =====
export interface InitSwarmRequest {
    advertiseAddr: string;
    listenAddr?: string;
    forceNewCluster?: boolean;
}

export interface InitSwarmResponse {
    success: boolean;
    nodeId: string;
}

export interface JoinSwarmRequest {
    advertiseAddr?: string;
    listenAddr?: string;
    remoteAddrs: string[];
    joinToken: string;
}

export interface JoinSwarmResponse {
    success: boolean;
}

export interface LeaveSwarmRequest {
    force?: boolean;
}

export interface LeaveSwarmResponse {
    success: boolean;
}

export interface SwarmInspectResponse {
    isSwarmActive: boolean;
    swarmInfo: SwarmInfo | null;
    nodes: SwarmNode[];
    services: SwarmService[];
    tasks: SwarmTask[];
}

export interface SwarmJoinTokensResponse {
    worker: string;
    manager: string;
}

export interface SwarmStatsResponse extends SwarmStats {}

// ===== NODE OPERATIONS =====
export interface ListNodesResponse {
    nodes: SwarmNode[];
}

export interface GetNodeResponse {
    node: SwarmNode;
    tasks: SwarmTask[];
}

export interface UpdateNodeRequest {
    availability?: SwarmNodeAvailability;
    role?: SwarmNodeRole;
    labels?: Record<string, string>;
}

export interface UpdateNodeResponse {
    success: boolean;
    node: SwarmNode;
}

export interface RemoveNodeRequest {
    force?: boolean;
}

export interface RemoveNodeResponse {
    success: boolean;
    nodeId: string;
}

export interface UpdateNodeLabelsRequest {
    labels: Record<string, string>;
    merge?: boolean;
}

// ===== SERVICE OPERATIONS =====
export interface ListServicesResponse {
    services: SwarmService[];
}

export interface GetServiceResponse {
    service: SwarmService;
    tasks: SwarmTask[];
}

export interface CreateServiceRequest {
    name: string;
    image: string;
    replicas?: number;
    mode?: 'replicated' | 'global';
    ports?: Array<{
        targetPort: number;
        publishedPort?: number;
        protocol?: 'tcp' | 'udp';
        publishMode?: 'ingress' | 'host';
    }>;
    env?: string[];
    labels?: Record<string, string>;
    networks?: string[];
    constraints?: string[];
    resources?: {
        limits?: { cpus?: number; memory?: number };
        reservations?: { cpus?: number; memory?: number };
    };
    mounts?: Array<{
        type: 'bind' | 'volume' | 'tmpfs';
        source?: string;
        target: string;
        readOnly?: boolean;
    }>;
    command?: string[];
    args?: string[];
    healthCheck?: {
        test: string[];
        interval?: number;
        timeout?: number;
        retries?: number;
        startPeriod?: number;
    };
    updateConfig?: {
        parallelism?: number;
        delay?: number;
        failureAction?: 'pause' | 'continue' | 'rollback';
        order?: 'stop-first' | 'start-first';
    };
}

export interface CreateServiceResponse {
    success: boolean;
    serviceId: string;
    service: SwarmService;
}

export interface UpdateServiceRequest {
    image?: string;
    replicas?: number;
    env?: string[];
    labels?: Record<string, string>;
    ports?: Array<{
        targetPort: number;
        publishedPort?: number;
        protocol?: 'tcp' | 'udp';
        publishMode?: 'ingress' | 'host';
    }>;
    constraints?: string[];
    resources?: {
        limits?: { cpus?: number; memory?: number };
        reservations?: { cpus?: number; memory?: number };
    };
    forceUpdate?: boolean;
}

export interface UpdateServiceResponse {
    success: boolean;
    service: SwarmService;
}

export interface ScaleServiceRequest {
    replicas: number;
}

export interface ScaleServiceResponse {
    success: boolean;
    service: SwarmService;
}

export interface RollbackServiceResponse {
    success: boolean;
    service: SwarmService;
}

export interface DeleteServiceResponse {
    success: boolean;
    serviceId: string;
}

export interface ServiceLogsRequest {
    tail?: number;
    since?: string;
    timestamps?: boolean;
    stdout?: boolean;
    stderr?: boolean;
}

export interface ServiceLogsResponse {
    logs: string;
}

// ===== TASK OPERATIONS =====
export interface ListTasksRequest {
    serviceId?: string;
    nodeId?: string;
    state?: SwarmTaskState | SwarmTaskState[];
    desiredState?: string;
}

export interface ListTasksResponse {
    tasks: SwarmTask[];
}

export interface GetTaskResponse {
    task: SwarmTask;
}

// ===== ERROR RESPONSE =====
export interface SwarmErrorResponse {
    error: string;
    code?: string;
    details?: Record<string, unknown>;
}
