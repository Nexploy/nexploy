export interface TraefikRequest {
    id: string;
    timestamp: string;
    clientAddr: string;
    clientHost: string;
    method: string;
    path: string;
    protocol: string;
    status: number;
    duration: number;
    size: number;
    routerName?: string;
    serviceName?: string;
    requestHost?: string;
    userAgent?: string;
}

export interface TraefikRequestEvent {
    type: 'initial' | 'request' | 'heartbeat';
    requests?: TraefikRequest[];
    request?: TraefikRequest;
    timestamp: number;
}
