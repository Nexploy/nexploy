export type DockerAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'kill';

export type ContainerState = 'created' | 'running' | 'restarting' | 'paused' | 'exited' | 'dead';

export interface ContainerTool {
    icon: any;
    label: string;
    disabledStates: ContainerState[];
    action?: () => Promise<void> | void;
    separator?: boolean;
}

export type Ports = {
    privatePort: number;
    publicPort: number;
    hostIps: string[];
    type: string;
};

export type DockerStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export type Labels = {
    [key: string]: string;
};

export interface Container {
    id: string;
    name: string;
    labels: Labels;
    status: string;
    ports: Ports[];
    state: ContainerState;
    image: string;
    health?: string;
    exitCode?: number;
    error?: string;
    timestamp: number;
}

export interface ContainerEvent {
    type:
        | 'initial'
        | 'added'
        | 'updated'
        | 'removed'
        | 'docker-available'
        | 'docker-unavailable'
        | 'docker-connecting'
        | 'heartbeat';
    message?: string;
    dockerStatus?: DockerStatus;
    container?: Container;
    containers?: Container[];
    containerId?: string;
    oldState?: ContainerState;
    changes?: any;
    timestamp: number;
}
