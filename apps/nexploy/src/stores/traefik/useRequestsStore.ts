import { create } from 'zustand';
import { TraefikRequestEvent } from '@workspace/typescript-interface/traefik/traefik.request';
import { RequestsState } from '@workspace/typescript-interface/stores/traefik/requestsStore';
import { sseMultiplexer } from '@/services/SSEMultiplexer';

export const useRequestsStore = create<RequestsState>((set, get) => ({
    requests: [],
    filteredRequests: [],
    error: null,
    lastUpdate: null,
    eventSource: null,
    maxRequests: 500,

    searchQuery: '',
    methodFilter: 'all',
    statusFilter: 'all',
    serviceFilter: 'all',

    setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().applyFilter();
    },

    setMethodFilter: (method) => {
        set({ methodFilter: method });
        get().applyFilter();
    },

    setStatusFilter: (status) => {
        set({ statusFilter: status });
        get().applyFilter();
    },

    setServiceFilter: (service) => {
        set({ serviceFilter: service });
        get().applyFilter();
    },

    setRequests: (requests) => {
        set({ requests });
        get().applyFilter();
    },

    addRequest: (request) =>
        set((state) => {
            const newRequests = [request, ...state.requests];

            if (newRequests.length > state.maxRequests) {
                newRequests.splice(state.maxRequests);
            }

            setTimeout(() => get().applyFilter(), 0);

            return {
                requests: newRequests,
                lastUpdate: Date.now(),
            };
        }),

    setError: (error) => set({ error }),

    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    applyFilter: () => {
        const { requests, searchQuery, methodFilter, statusFilter, serviceFilter } = get();

        let filtered = requests;

        if (methodFilter !== 'all') {
            filtered = filtered.filter((r) => r.method === methodFilter);
        }

        if (serviceFilter !== 'all') {
            filtered = filtered.filter((r) => r.serviceName === serviceFilter);
        }

        if (statusFilter !== 'all') {
            const statusNum = parseInt(statusFilter);
            if (statusFilter === '2xx') {
                filtered = filtered.filter((r) => r.status >= 200 && r.status < 300);
            } else if (statusFilter === '3xx') {
                filtered = filtered.filter((r) => r.status >= 300 && r.status < 400);
            } else if (statusFilter === '4xx') {
                filtered = filtered.filter((r) => r.status >= 400 && r.status < 500);
            } else if (statusFilter === '5xx') {
                filtered = filtered.filter((r) => r.status >= 500);
            } else if (!isNaN(statusNum)) {
                filtered = filtered.filter((r) => r.status === statusNum);
            }
        }

        if (searchQuery.trim()) {
            const search = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (r) =>
                    r.path.toLowerCase().includes(search) ||
                    r.requestHost?.toLowerCase().includes(search) ||
                    r.serviceName?.toLowerCase().includes(search) ||
                    r.routerName?.toLowerCase().includes(search) ||
                    r.clientHost.toLowerCase().includes(search),
            );
        }

        set({ filteredRequests: filtered });
    },

    connect: (params) => {
        const state = get();

        if (state.eventSource) {
            return;
        }

        try {
            const unsubscribers: (() => void)[] = [];
            const channelParams = params?.environmentId
                ? { environment: params.environmentId }
                : undefined;

            unsubscribers.push(
                sseMultiplexer.subscribe('traefik', 'initial-state', (e) => {
                    const data: TraefikRequestEvent = JSON.parse(e.data);
                    get().setRequests(data.requests || []);
                    set({ lastUpdate: data.timestamp, error: null });
                }, channelParams),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('traefik', 'request', (e) => {
                    const data: TraefikRequestEvent = JSON.parse(e.data);
                    if (data.request) {
                        get().addRequest(data.request);
                    }
                }, channelParams),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('traefik', 'clear', (e) => {
                    const data: TraefikRequestEvent = JSON.parse(e.data);
                    get().setRequests(data.requests || []);
                }, channelParams),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('traefik', 'heartbeat', (e) => {
                    const data: TraefikRequestEvent = JSON.parse(e.data);
                    set({ lastUpdate: data.timestamp });
                }, channelParams),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
        } catch (err) {
            set({ error: err as Error });
        }
    },

    disconnect: () => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }

        set({ eventSource: null });
    },

    reset: () => {
        set({
            requests: [],
            filteredRequests: [],
            error: null,
            lastUpdate: null,
            eventSource: null,
            maxRequests: 500,

            searchQuery: '',
            methodFilter: 'all',
            statusFilter: 'all',
            serviceFilter: 'all',
        });
    },
}));
