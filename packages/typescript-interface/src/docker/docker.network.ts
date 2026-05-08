import { IPAM } from 'dockerode';

export interface Network {
    id: string;
    name: string;
    driver: string;
    scope: string;
    internal: boolean;
    attachable: boolean;
    ingress: boolean;
    ipam?: IPAM;
    containers: string[];
    options: Record<string, string>;
    labels: Record<string, string>;
    created: number;
    enableIPv6: boolean;
    timestamp: number;
}

export type NetworkAction = 'create' | 'connect' | 'disconnect' | 'destroy' | 'remove' | 'update';

export interface NetworkDeleteResponse {
    deleted: string[];
    skipped: { id: string; name: string; reason: string }[];
}

export interface NetworkStateChanges {
    containers?: {
        from: string[];
        to: string[];
    };
    internal?: {
        from: boolean;
        to: boolean;
    };
    attachable?: {
        from: boolean;
        to: boolean;
    };
    labels?: {
        from: Record<string, string>;
        to: Record<string, string>;
    };
    driver?: {
        from: string | undefined;
        to: string | undefined;
    };
    scope?: {
        from: string | undefined;
        to: string | undefined;
    };
    enableIPv6?: {
        from: boolean;
        to: boolean;
    };
    ipam?: boolean;
    options?: boolean;
}

export interface NetworkEvent {
    type: 'initial' | 'added' | 'removed' | 'updated' | 'state-change' | 'heartbeat';
    networks?: Network[];
    network?: Network;
    networkId?: string;
    oldState?: Network;
    changes?: NetworkStateChanges;
    timestamp: number;
}

export interface NetworkContainerInfo {
    containerId: string;
    name: string;
    ipv4Address?: string;
    ipv6Address?: string;
    macAddress?: string;
    endpointId?: string;
}

export interface CreateNetworkOptions {
    name: string;
    driver?: string;
    internal?: boolean;
    attachable?: boolean;
    enableIPv6?: boolean;
    ipam?: IPAM;
    options?: Record<string, string>;
    labels?: Record<string, string>;
}

export interface NetworkManagerStats {
    networkCount: number;
    eventStreamActive: boolean;
    reconnectAttempts: number;
    polling: boolean;
}

export interface NetworkListFilter {
    driver?: string;
    name?: string;
    id?: string;
    label?: string[];
    type?: 'custom' | 'builtin';
}

export interface NetworkConnectOptions {
    containerId: string;
    networkId: string;
    endpointConfig?: {
        ipamConfig?: {
            ipv4Address?: string;
            ipv6Address?: string;
        };
        links?: string[];
        aliases?: string[];
    };
}

export interface NetworkDisconnectOptions {
    containerId: string;
    networkId: string;
    force?: boolean;
}

export interface NetworkDetailEvent {
    type: 'initial-state' | 'state-change' | 'removed' | 'not-found' | 'heartbeat';
    networkId: string;
    network?: Network;
    timestamp: number;
}
