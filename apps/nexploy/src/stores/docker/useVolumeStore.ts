import { create } from 'zustand';
import { VolumeEvent } from '@workspace/typescript-interface/docker/docker.volume';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import { VolumeState } from '@workspace/typescript-interface/stores/volumesStore';

export const useVolumeStore = create<VolumeState>((set, get) => ({
    volumes: [],
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,

    setVolumes: (volumes) => set({ volumes }),

    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    addVolume: (volume) =>
        set((state) => {
            const newVolumes = [...state.volumes, volume];

            newVolumes.sort((a, b) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                return nameA.localeCompare(nameB);
            });

            return { volumes: newVolumes };
        }),

    removeVolume: (volumeName) =>
        set((state) => ({
            volumes: state.volumes.filter((vol) => vol.name !== volumeName),
        })),

    updateVolume: (volume) =>
        set((state) => ({
            volumes: state.volumes.map((vol) => (vol.name === volume.name ? volume : vol)),
        })),

    getVolume: (name) => {
        return get().volumes.find((vol) => vol.name === name);
    },

    connect: () => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const url = new URL('/api/events/stream', window.location.origin);

            url.searchParams.set('endpoint', '/api/volumes/events/stream');

            const eventSource = new EventSource(url.toString());

            eventSource.addEventListener('open', () => {
                console.log('SSE Volume connection established');
                set({ error: null, eventSource });
            });

            eventSource.addEventListener('initial-state', (e) => {
                const data: VolumeEvent = JSON.parse(e.data);
                set({
                    volumes: data.volumes || [],
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('heartbeat', (e) => {
                const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                set({ lastUpdate: timestamp });
            });

            eventSource.addEventListener('state-change', (e) => {
                const data: VolumeEvent = JSON.parse(e.data);

                if (data.volume) {
                    const volumes = [...get().volumes];
                    const index = volumes.findIndex((vol) => vol.name === data.volume!.name);

                    if (index !== -1) {
                        volumes[index] = data.volume;
                    } else {
                        volumes.push(data.volume);
                    }

                    set({
                        volumes,
                        lastUpdate: data.timestamp,
                    });
                }
            });

            eventSource.addEventListener('volume-added', (e) => {
                const data: VolumeEvent = JSON.parse(e.data);
                if (!data.volume) return;

                get().addVolume(data.volume);
                toast.success(`Volume ${data.volume.name} ajouté`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('volume-updated', (e) => {
                const data: VolumeEvent = JSON.parse(e.data);
                const volume = data.volume;
                if (!volume) return;

                get().updateVolume(volume);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('volume-removed', (e) => {
                const data: VolumeEvent = JSON.parse(e.data);
                if (!data.volumeName) return;

                get().removeVolume(data.volumeName);
                toast.success(`Volume ${data.volumeName} supprimé`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('error', () => {
                const currentEventSource = get().eventSource;

                if (currentEventSource) {
                    currentEventSource.close();
                    set({ eventSource: null });
                }

                set({ error: new Error('Error connecting to Volume Docker') });

                const timeout = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    get().connect();
                }, 5000);

                set({ reconnectTimeout: timeout });
            });

            set({ eventSource });
        } catch (err) {
            console.error('Volumes - Failed to connect :', err);
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
