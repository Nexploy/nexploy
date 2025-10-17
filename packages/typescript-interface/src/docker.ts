export type DockerAction = 'start' | 'stop' | 'restart' | 'pause'

export type ContainerState =
    | 'created'
    | 'running'
    | 'restarting'
    | 'removing'
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
