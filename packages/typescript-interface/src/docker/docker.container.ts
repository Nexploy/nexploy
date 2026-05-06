import { DropdownActionTool } from '../commun';
import { ContainerPorts } from './docker.port';

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
    | 'health_status'
    | 'rename';

export type ContainerType =
    | 'initial'
    | 'added'
    | 'updated'
    | 'removed'
    | 'heartbeat'
    | 'state-change';

export type Event =
    | 'state-change'
    | 'initial-state'
    | 'container-added'
    | 'container-removed'
    | 'container-updated';

export type ContainerState = 'created' | 'running' | 'restarting' | 'paused' | 'exited' | 'dead';

export interface ContainerTool extends DropdownActionTool {
    disabledStates: ContainerState[];
    id: ContainerStateEvents;
    variant?: 'default' | 'destructive' | 'outline';
}

export interface Container {
    id: string;
    name: string;
    image: string;
    imageId: string;
    platform: string;
    driver: string;
    createdAt: string;

    status: string;
    state: ContainerState;
    running: boolean;
    paused: boolean;
    restarting: boolean;
    dead: boolean;
    exitCode: number;
    error: string;
    startedAt: string;
    finishedAt: string;
    restartCount: number;

    health?: {
        status: string;
        failingStreak: number;
        logs: Array<{
            start: string;
            end: string;
            exitCode: number;
            output: string;
        }>;
    };

    path: string;
    args: string[];
    cmd: string[];
    entrypoint?: string | string[];
    workingDir: string;
    user: string;
    env: string[];

    labels: Record<string, string>;
    appArmorProfile?: string;
    mountLabel?: string;
    processLabel?: string;

    network: {
        mode?: string;
        ipAddress?: string;
        gateway?: string;
        macAddress?: string;
        bridge?: string;
        sandboxId?: string;
        endpointId?: string;
        ports: ContainerPorts[];
        networks: Record<
            string,
            {
                networkId: string;
                endpointId: string;
                gateway: string;
                ipAddress: string;
                ipPrefixLen: number;
                ipv6Gateway: string;
                globalIPv6Address: string;
                globalIPv6PrefixLen: number;
                macAddress: string;
            }
        >;
    };

    mounts: Array<{
        type: string;
        name?: string;
        source: string;
        destination: string;
        driver?: string;
        mode: string;
        rw: boolean;
        propagation: string;
    }>;

    graphDriver?: {
        name: string;
        data: {
            deviceId?: string;
            deviceName?: string;
            deviceSize?: string;
        };
    };

    execIds?: string[];
    timestamp: number;
}

export interface ContainerEvent {
    type: ContainerType;
    message?: string;
    action?: ContainerStateEvents;
    container?: Container;
    containerId?: string;
    oldState?: Container;
    changes?: ContainerStateChanges;
    timestamp: number;
}

export interface ContainerStateChanges {
    name?: {
        from: string;
        to: string;
    };
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
    error?: {
        from: string | undefined;
        to: string | undefined;
    };
    restartCount?: {
        from: number | undefined;
        to: number | undefined;
    };
    networkPorts?: boolean;
    mounts?: boolean;
}
