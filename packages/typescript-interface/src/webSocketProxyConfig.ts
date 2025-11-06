import WebSocket from 'ws';

export interface WebSocketProxyConfig {
    serverUrl?: string;
    endpoint: string;
    queryParams?: Record<string, string | null>;
    requestHeaders?: Record<string, string>;
    transformClientMessage?: (data: WebSocket.RawData) => WebSocket.RawData;
    transformBackendMessage?: (data: WebSocket.RawData) => WebSocket.RawData;
    onError?: (error: Error) => void;
    onClose?: () => void;
}
