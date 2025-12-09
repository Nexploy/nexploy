import type {
    SwarmInfo,
    SwarmNode,
    SwarmService,
    SwarmTask,
    SwarmNodeRole,
    SwarmNodeAvailability,
    SwarmNodeState,
    SwarmTaskState,
} from './swarm.types';

// ===== BASE EVENT =====
interface BaseSwarmEvent {
    timestamp: number;
}

// ===== INITIAL STATE EVENTS =====
export interface SwarmInitialStateEvent extends BaseSwarmEvent {
    type: 'initial';
    isSwarmActive: true;
    swarmInfo: SwarmInfo;
    nodes: SwarmNode[];
    services: SwarmService[];
    tasks: SwarmTask[];
}

export interface SwarmNotActiveEvent extends BaseSwarmEvent {
    type: 'not-in-swarm';
    isSwarmActive: false;
}

// ===== NODE EVENTS =====
export interface SwarmNodeAddedEvent extends BaseSwarmEvent {
    type: 'node-added';
    node: SwarmNode;
}

export interface SwarmNodeUpdatedEvent extends BaseSwarmEvent {
    type: 'node-updated';
    node: SwarmNode;
    previousNode: SwarmNode;
    changes: SwarmNodeChanges;
}

export interface SwarmNodeRemovedEvent extends BaseSwarmEvent {
    type: 'node-removed';
    nodeId: string;
    previousNode: SwarmNode;
}

export interface SwarmNodeChanges {
    role?: { from: SwarmNodeRole; to: SwarmNodeRole };
    availability?: { from: SwarmNodeAvailability; to: SwarmNodeAvailability };
    state?: { from: SwarmNodeState; to: SwarmNodeState };
    labels?: { added: string[]; removed: string[]; changed: string[] };
    managerStatus?: boolean;
}

// ===== SERVICE EVENTS =====
export interface SwarmServiceAddedEvent extends BaseSwarmEvent {
    type: 'service-added';
    service: SwarmService;
}

export interface SwarmServiceUpdatedEvent extends BaseSwarmEvent {
    type: 'service-updated';
    service: SwarmService;
    previousService: SwarmService;
    changes: SwarmServiceChanges;
}

export interface SwarmServiceRemovedEvent extends BaseSwarmEvent {
    type: 'service-removed';
    serviceId: string;
    previousService: SwarmService;
}

export interface SwarmServiceChanges {
    replicas?: { from: number; to: number };
    runningReplicas?: { from: number; to: number };
    image?: { from: string; to: string };
    updateStatus?: boolean;
}

// ===== TASK EVENTS =====
export interface SwarmTaskAddedEvent extends BaseSwarmEvent {
    type: 'task-added';
    task: SwarmTask;
}

export interface SwarmTaskUpdatedEvent extends BaseSwarmEvent {
    type: 'task-updated';
    task: SwarmTask;
    previousTask: SwarmTask;
    changes: SwarmTaskChanges;
}

export interface SwarmTaskRemovedEvent extends BaseSwarmEvent {
    type: 'task-removed';
    taskId: string;
    previousTask: SwarmTask;
}

export interface SwarmTaskChanges {
    state?: { from: SwarmTaskState; to: SwarmTaskState };
    desiredState?: { from: string; to: string };
    nodeId?: { from: string | undefined; to: string | undefined };
    message?: string;
    error?: string;
}

// ===== SWARM INFO EVENT =====
export interface SwarmInfoUpdatedEvent extends BaseSwarmEvent {
    type: 'swarm-updated';
    swarmInfo: SwarmInfo;
}

// ===== HEARTBEAT =====
export interface SwarmHeartbeatEvent extends BaseSwarmEvent {
    type: 'heartbeat';
}

// ===== UNION TYPE =====
export type SwarmEvent =
    | SwarmInitialStateEvent
    | SwarmNotActiveEvent
    | SwarmNodeAddedEvent
    | SwarmNodeUpdatedEvent
    | SwarmNodeRemovedEvent
    | SwarmServiceAddedEvent
    | SwarmServiceUpdatedEvent
    | SwarmServiceRemovedEvent
    | SwarmTaskAddedEvent
    | SwarmTaskUpdatedEvent
    | SwarmTaskRemovedEvent
    | SwarmInfoUpdatedEvent
    | SwarmHeartbeatEvent;

export type SwarmEventType = SwarmEvent['type'];
