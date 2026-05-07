import { create } from 'zustand';
import { VolumeEvent } from '@workspace/typescript-interface/docker/docker.volume';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import { VolumeState } from '@workspace/typescript-interface/stores/docker/volumesStore';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { clientT } from '@/lib/i18n/clientTranslations';

export const useVolumesStore = create<VolumeState>((set, get) => ({
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

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(
                sseMultiplexer.subscribe('volumes', 'initial-state', (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    set({
                        volumes: data.volumes || [],
                        lastUpdate: data.timestamp,
                        error: null,
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('volumes', 'heartbeat', (e) => {
                    const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('volumes', 'state-change', (e) => {
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
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('volumes', 'volume-added', (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    if (!data.volume) return;

                    get().addVolume(data.volume);
                    toast.success(clientT('toasts.volumeAdded', { name: data.volume.name }));
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('volumes', 'volume-updated', (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    const volume = data.volume;
                    if (!volume) return;

                    get().updateVolume(volume);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('volumes', 'volume-removed', (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    if (!data.volumeName) return;

                    get().removeVolume(data.volumeName);
                    toast.success(clientT('toasts.volumeRemoved', { name: data.volumeName }));
                    set({ lastUpdate: data.timestamp });
                }),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
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

    reset: () => {
        get().disconnect();

        set({
            volumes: [],
            error: null,
            lastUpdate: null,
            eventSource: null,
            reconnectTimeout: null,
        });
    },
}));
