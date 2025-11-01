export interface SSEProxyConfig {
    serverUrl?: string;
    endpoint: string;
    queryParams?: Record<string, string | null>;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    onError?: (error: Error) => void;
    onClose?: () => void;
    transformData?: (data: Uint8Array) => Uint8Array;
}

export type SSEChannel = 'containers' | 'images' | 'docker' | 'events' | 'volumes' | 'networks';

export interface SSEMultiplexedMessage {
    channel: SSEChannel;
    event: string;
    data: string;
}

export type SSEEventHandler = (event: MessageEvent) => void;

export interface SSEChannelSubscription {
    channel: SSEChannel;
    eventHandlers: Map<string, SSEEventHandler[]>;
}
