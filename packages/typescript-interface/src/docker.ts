export type DockerAction = 'start' | 'stop' | 'restart' | 'pause'

export type ContainerState =
    | 'created'
    | 'running'
    | 'restarting'
    | 'paused'
    | 'exited'
    | 'dead';

export interface ContainerTool {
    icon: any;
    label: string;
    state?: ContainerState[];
    action?: () => Promise<void> | void;
    separator?: boolean;
}

export interface Container {
    id: string
    name: string
    status: string
    state: ContainerState
    image: string
    health?: string
    exitCode?: number
    error?: string
    timestamp: number
}
