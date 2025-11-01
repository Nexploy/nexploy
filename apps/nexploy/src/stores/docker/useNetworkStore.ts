import { create } from 'zustand';
import { Network, NetworkEvent } from '@workspace/typescript-interface/docker/docker.network';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import { NetworkState } from '@workspace/typescript-interface/stores/networksStore';

export const useNetworkStore = create<NetworkState>((set, get) => ({
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

        const builtinNames = ['bridge', 'host', 'none'];

        get().networks.forEach((network) => {
            if (!byDriver.has(network.driver)) {
                byDriver.set(network.driver, []);
            }
            byDriver.get(network.driver)!.push(network);

            if (builtinNames.includes(network.name)) {
                builtin.push(network);
            } else {
                custom.push(network);
            }
        });

        return { byDriver, builtin, custom };
    },

    connect: (networkIds) => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const url = new URL('/api/events/stream', window.location.origin);

            if (networkIds?.length) url.searchParams.set('networks', networkIds.join(','));
            url.searchParams.set('endpoint', '/api/networks/events/stream');

            const eventSource = new EventSource(url.toString());

            eventSource.addEventListener('open', () => {
                console.log('SSE Network connection established');
                set({ error: null, eventSource });
            });

            eventSource.addEventListener('initial-state', (e) => {
                const data: NetworkEvent = JSON.parse(e.data);
                set({
                    networks: data.networks || [],
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('heartbeat', (e) => {
                const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                set({ lastUpdate: timestamp });
            });

            eventSource.addEventListener('state-change', (e) => {
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
            });

            eventSource.addEventListener('network-added', (e) => {
                const data: NetworkEvent = JSON.parse(e.data);
                if (!data.network) return;

                get().addNetwork(data.network);
                toast.success(`Network ${data.network.name} added`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('network-updated', (e) => {
                const data: NetworkEvent = JSON.parse(e.data);
                const network = data.network;
                if (!network) return;

                const { timestamp } = data;

                get().updateNetwork(network);

                // Optionnel : afficher une notification pour les changements majeurs
                // if (data.changes?.containers) {
                //     toast.info(`Network ${network.name} updated`);
                // }

                set({ lastUpdate: timestamp });
            });

            eventSource.addEventListener('network-removed', (e) => {
                const data: NetworkEvent = JSON.parse(e.data);
                if (!data.networkId) return;

                get().removeNetwork(data.networkId);
                const networkName = data.oldState?.name || data.networkId.substring(0, 12);
                toast.success(`Network ${networkName} removed`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('error', () => {
                const currentEventSource = get().eventSource;

                if (currentEventSource) {
                    currentEventSource.close();
                    set({ eventSource: null });
                }

                set({ error: new Error('Error connecting to Network Docker') });

                const timeout = setTimeout(() => {
                    console.log('Attempting to reconnect to networks...');
                    get().connect(networkIds);
                }, 5000);

                set({ reconnectTimeout: timeout });
            });

            set({ eventSource });
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
}));
