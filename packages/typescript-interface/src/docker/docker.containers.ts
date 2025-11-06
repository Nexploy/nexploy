import { DropdownActionTool } from '../commun';
import { ContainerState } from './docker.container';

export type ContainersAction =
    | 'start'
    | 'stop'
    | 'restart'
    | 'pause'
    | 'unpause'
    | 'kill'
    | 'remove';

export type ContainersStateEvents =
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

export type ContainersType = 'initial' | 'added' | 'updated' | 'removed' | 'heartbeat';

export type Event =
    | 'state-change'
    | 'initial-state'
    | 'container-added'
    | 'container-removed'
    | 'container-updated';

export interface ContainersTool extends DropdownActionTool {
    disabledStates: ContainerState[];
    variant?: 'default' | 'destructive';
}

export type ContainersPorts = {
    privatePort: number;
    publicPort: number;
    hostIps: string[];
    type: string;
};

export type Labels = {
    [key: string]: string;
};

export interface Containers {
    id: string;
    name: string;
    labels: Labels;
    status: string;
    ports: ContainersPorts[];
    state: ContainerState;
    image: string;
    health?: string;
    exitCode?: number;
    error?: string;
    timestamp: number;
}

export interface ContainersEvent {
    type: ContainersType;
    message?: string;
    action?: ContainersStateEvents;
    container?: Containers;
    containers?: Containers[];
    containerId?: string;
    oldState?: Containers;
    changes?: ContainersStateChanges;
    timestamp: number;
}

export interface ContainersStateChanges {
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
