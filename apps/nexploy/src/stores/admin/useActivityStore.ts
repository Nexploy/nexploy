import { create } from 'zustand';
import type { ActivityConnectionState, ActivityStreamEvent } from '@workspace/typescript-interface/activity';

const STREAM_URL = '/api/events/activity/stream';
const RECONNECT_DELAY = 5000;

export interface ActivityState {
    revision: number;
    isConnected: boolean;
    connectionState: ActivityConnectionState;
    lastUpdate: number | null;
    error: string | null;
    search: string;

    connect: () => void;
    disconnect: () => void;
    refresh: () => void;
    setSearch: (search: string) => void;
}

let eventSource: EventSource | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

export const useActivityStore = create<ActivityState>((set) => {
    const clearReconnect = () => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    };

    const closeStream = () => {
        clearReconnect();

        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    };

    const handleEvent = (event: ActivityStreamEvent) => {
        switch (event.type) {
            case 'ready': {
                set({
                    isConnected: true,
                    connectionState: 'connected',
                    lastUpdate: event.timestamp,
                    error: null,
                });
                break;
            }

            case 'activity-created': {
                set((state) => ({ revision: state.revision + 1, lastUpdate: event.timestamp }));
                break;
            }

            case 'activity-purged': {
                if (event.purged === 0) return;

                set((state) => ({ revision: state.revision + 1, lastUpdate: event.timestamp }));
                break;
            }

            case 'heartbeat': {
                set({ lastUpdate: event.timestamp });
                break;
            }

            case 'error': {
                set({ error: event.error, connectionState: 'error' });
                break;
            }
        }
    };

    const openStream = () => {
        closeStream();

        set({ connectionState: 'connecting', error: null });

        eventSource = new EventSource(STREAM_URL);

        eventSource.addEventListener('message', (message) => {
            try {
                handleEvent(JSON.parse(message.data) as ActivityStreamEvent);
            } catch (error) {
                console.error('[Activity] Error parsing stream message:', error);
            }
        });

        eventSource.addEventListener('error', () => {
            closeStream();

            set({ isConnected: false, connectionState: 'error' });

            reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                openStream();
            }, RECONNECT_DELAY);
        });
    };

    return {
        revision: 0,
        isConnected: false,
        connectionState: 'disconnected',
        lastUpdate: null,
        error: null,
        search: '',

        connect: () => {
            if (eventSource) return;

            openStream();
        },

        disconnect: () => {
            closeStream();

            set({ isConnected: false, connectionState: 'disconnected' });
        },

        refresh: () => {
            set((state) => ({ revision: state.revision + 1 }));

            if (!eventSource) openStream();
        },

        setSearch: (search: string) => set({ search }),
    };
});
