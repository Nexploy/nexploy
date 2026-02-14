export type DockerStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export type Event = 'status-changed' | 'reconnected' | 'disconnected';

export type Type =
    | 'initial'
    | 'added'
    | 'updated'
    | 'removed'
    | 'heartbeat'
    | 'status-changed'
    | 'reconnected'
    | 'disconnected';

export interface DockerStatusEventBase {
    type?: Type;
    status?: DockerStatus;
    isConnected?: boolean;
    lastCheck?: number;
    timestamp: number;
}

export type MessageLevel = 'success' | 'info' | 'warning' | 'error' | 'loading';

export interface DockerStatusEventWithMessage extends DockerStatusEventBase {
    message: {
        key: string;
        level: MessageLevel;
    };
}

export interface DockerStatusEventWithoutMessage extends DockerStatusEventBase {
    message?: undefined;
}

export type DockerStatusEvent = DockerStatusEventWithMessage | DockerStatusEventWithoutMessage;
