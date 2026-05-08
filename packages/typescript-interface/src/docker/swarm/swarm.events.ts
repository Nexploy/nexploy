import type {
    SwarmInfo,
    SwarmNode,
    SwarmNodeAvailability,
    SwarmNodeRole,
    SwarmNodeState,
    SwarmService,
    SwarmTask,
    SwarmTaskState,
} from './swarm.types';

interface BaseSwarmEvent {
    timestamp: number;
}

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
    hostname?: { from: string; to: string };
    address?: { from: string; to: string };
    resources?: boolean;
}

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
    name?: { from: string; to: string };
    ports?: boolean;
    labels?: boolean;
    env?: boolean;
    constraints?: boolean;
    networks?: boolean;
}

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
    containerStatus?: boolean;
}

export interface SwarmInfoUpdatedEvent extends BaseSwarmEvent {
    type: 'swarm-updated';
    swarmInfo: SwarmInfo;
}

export interface SwarmHeartbeatEvent extends BaseSwarmEvent {
    type: 'heartbeat';
}

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

export interface ServiceDetailEvent {
    type: 'initial-state' | 'service-updated' | 'service-removed' | 'task-added' | 'task-updated' | 'task-removed' | 'not-found' | 'heartbeat';
    serviceId: string;
    service?: SwarmService;
    tasks?: SwarmTask[];
    timestamp: number;
}

export interface NodeDetailEvent {
    type: 'initial-state' | 'node-updated' | 'node-removed' | 'not-found' | 'heartbeat';
    nodeId: string;
    node?: SwarmNode;
    tasks?: SwarmTask[];
    timestamp: number;
}
