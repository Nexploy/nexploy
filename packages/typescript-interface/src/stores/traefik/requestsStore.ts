import { TraefikRequest } from '../../traefik/traefik.request';

export interface RequestsFilter {
    methods?: string[];
    statuses?: number[];
    search?: string;
}

export interface RequestsState {
    requests: TraefikRequest[];
    filteredRequests: TraefikRequest[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    maxRequests: number;

    searchQuery: string;
    methodFilter: string;
    statusFilter: string;

    setSearchQuery: (query: string) => void;
    setMethodFilter: (method: string) => void;
    setStatusFilter: (status: string) => void;

    setRequests: (requests: TraefikRequest[]) => void;
    addRequest: (request: TraefikRequest) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    applyFilter: () => void;

    connect: (params?: { environmentId?: string }) => void;
    disconnect: () => void;
    reset: () => void;
}
