import { create } from 'zustand';
import { Network, NetworkEvent } from '@workspace/typescript-interface/docker/docker.network';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import { NetworkState } from '@workspace/typescript-interface/stores/docker/networksStore';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { clientT } from '@/lib/i18n/clientTranslations';
import { isBuiltinNetwork } from '@workspace/shared/nexployFilter';

export const useNetworksStore = create<NetworkState>((set, get) => ({
    networks: [],
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,

    setNetworks: (networks) => set({ networks }),

    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    addNetwork: (network) =>
        set((state) => {
            if (state.networks.find((net) => net.id === network.id)) {
                return state;
            }

            return { networks: [...state.networks, network] };
        }),

    removeNetwork: (networkId) =>
        set((state) => ({
            networks: state.networks.filter((net) => net.id !== networkId),
        })),

    updateNetwork: (network) =>
        set((state) => ({
            networks: state.networks.map((net) => (net.id === network.id ? network : net)),
        })),

    getNetwork: (id) => {
        return get().networks.find((net) => net.id === id);
    },

    getNetworkByName: (name) => {
        return get().networks.find((net) => net.name === name);
    },

    getNetworksByDriver: (driver) => {
        return get().networks.filter((net) => net.driver === driver);
    },

    getConnectedNetworks: (containerId) => {
        return get().networks.filter((net) => net.containers?.includes(containerId));
    },

    getOrganizedNetworks: () => {
        const byDriver = new Map<string, Network[]>();
        const builtin: Network[] = [];
        const custom: Network[] = [];

        get().networks.forEach((network) => {
            if (!byDriver.has(network.driver)) {
                byDriver.set(network.driver, []);
            }
            byDriver.get(network.driver)!.push(network);

            if (isBuiltinNetwork(network.name)) {
                builtin.push(network);
            } else {
                custom.push(network);
            }
        });

        return { byDriver, builtin, custom };
    },

    connect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(
                sseMultiplexer.subscribe('networks', 'initial-state', (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    set({
                        networks: data.networks || [],
                        lastUpdate: data.timestamp,
                        error: null,
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('networks', 'heartbeat', (e) => {
                    const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('networks', 'state-change', (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);

                    if (data.network) {
                        const networks = [...get().networks];
                        const index = networks.findIndex((net) => net.id === data.network!.id);

                        if (index !== -1) {
                            networks[index] = data.network;
                        } else {
                            networks.push(data.network);
                        }

                        set({
                            networks,
                            lastUpdate: data.timestamp,
                        });
                    }
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('networks', 'network-added', (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    if (!data.network) return;

                    get().addNetwork(data.network);
                    toast.success(clientT('toasts.networkAdded', { name: data.network.name }));
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('networks', 'network-updated', (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    const network = data.network;
                    if (!network) return;

                    get().updateNetwork(network);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('networks', 'network-removed', (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    if (!data.networkId) return;

                    get().removeNetwork(data.networkId);
                    const networkName = data.oldState?.name || data.networkId;
                    toast.success(clientT('toasts.networkRemoved', { name: networkName }));
                    set({ lastUpdate: data.timestamp });
                }),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
        } catch (err) {
            console.error('Networks - Failed to connect :', err);
            set({
                error: err as Error,
            });
        }
    },

    disconnect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        if (state.eventSource) {
            state.eventSource.close();
        }

        set({
            eventSource: null,
            reconnectTimeout: null,
        });
    },

    reset: () => {
        get().disconnect();

        set({
            networks: [],
            error: null,
            lastUpdate: null,
            eventSource: null,
            reconnectTimeout: null,
        });
    },
}));
