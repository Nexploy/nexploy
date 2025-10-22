import { DropdownActionTool } from './commun';

export type ContainerAction =
    | 'start'
    | 'stop'
    | 'restart'
    | 'pause'
    | 'unpause'
    | 'kill'
    | 'remove';

export type ContainerStateEvents =
    | 'start'
    | 'die'
    | 'stop'
    | 'pause'
    | 'unpause'
    | 'restart'
    | 'kill'
    | 'create'
    | 'destroy'
    | 'health_status';

export type ContainerType = 'initial' | 'added' | 'updated' | 'removed' | 'heartbeat';

export type Event =
    | 'state-change'
    | 'initial-state'
    | 'container-added'
    | 'container-removed'
    | 'container-updated';

export type ContainerState = 'created' | 'running' | 'restarting' | 'paused' | 'exited' | 'dead';

export interface ContainerTool extends DropdownActionTool {
    disabledStates: ContainerState[];
}

export type ContainerPorts = {
    privatePort: number;
    publicPort: number;
    hostIps: string[];
    type: string;
};

export type Labels = {
    [key: string]: string;
};

export interface Container {
    id: string;
    name: string;
    labels: Labels;
    status: string;
    ports: ContainerPorts[];
    state: ContainerState;
    image: string;
    health?: string;
    exitCode?: number;
    error?: string;
    timestamp: number;
}

export interface ContainerEvent {
    type: ContainerType;
    message?: string;
    action?: ContainerStateEvents;
    container?: Container;
    containers?: Container[];
    containerId?: string;
    oldState?: Container;
    changes?: ContainerStateChanges;
    timestamp: number;
}

export interface ContainerStateChanges {
    state?: {
        from: string;
        to: string;
    };
    status?: {
        from: string;
        to: string;
    };
    health?: {
        from?: string | null;
        to?: string | null;
    };
    exitCode?: {
        from?: number | null;
        to?: number | null;
    };
}
