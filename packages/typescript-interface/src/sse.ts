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
