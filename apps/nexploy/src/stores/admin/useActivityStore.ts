import { create } from 'zustand';
import type {
    ActivityConnectionState,
    ActivityLogEntry,
    ActivityLogPage,
    ActivityStreamEvent,
} from '@workspace/typescript-interface/activity';
import { fetcherApi } from '@/lib/api/fetcherApi';

const STREAM_URL = '/api/events/activity/stream';
const STREAM_LIMIT = 200;
const OLDER_PAGE_SIZE = 200;
const MAX_ENTRIES = 2000;
const RECONNECT_DELAY = 5000;

export interface ActivityState {
    entries: ActivityLogEntry[];
    hasMore: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    isConnected: boolean;
    connectionState: ActivityConnectionState;
    lastUpdate: number | null;
    error: string | null;

    connect: () => void;
    disconnect: () => void;
    refresh: () => void;
    applyPurge: (purgedBefore: string | null) => void;
    loadMore: () => Promise<void>;
}

let eventSource: EventSource | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let resetOnNextInitialState = false;

function sortEntries(entries: ActivityLogEntry[]): ActivityLogEntry[] {
    return entries.sort((a, b) => {
        const delta = b.createdAt.localeCompare(a.createdAt);

        return delta === 0 ? b.id.localeCompare(a.id) : delta;
    });
}

function mergeEntries(current: ActivityLogEntry[], incoming: ActivityLogEntry[]): ActivityLogEntry[] {
    const byId = new Map(current.map((entry) => [entry.id, entry]));
    incoming.forEach((entry) => byId.set(entry.id, entry));

    return sortEntries(Array.from(byId.values()));
}

export const useActivityStore = create<ActivityState>((set, get) => {
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
            case 'initial-state': {
                const previous = resetOnNextInitialState ? [] : get().entries;
                resetOnNextInitialState = false;

                const entries = mergeEntries(previous, event.entries);

                set({
                    entries,
                    hasMore: previous.length > 0 ? get().hasMore : event.hasMore,
                    isLoading: false,
                    isConnected: true,
                    connectionState: 'connected',
                    lastUpdate: event.timestamp,
                    error: null,
                });
                break;
            }

            case 'activity-created': {
                const entries = mergeEntries(get().entries, [event.entry]);
                const overflows = entries.length > MAX_ENTRIES;

                set((state) => ({
                    entries: overflows ? entries.slice(0, MAX_ENTRIES) : entries,
                    hasMore: overflows ? true : state.hasMore,
                    lastUpdate: event.timestamp,
                }));
                break;
            }

            case 'activity-purged': {
                if (event.purged === 0) return;

                get().applyPurge(event.purgedBefore);
                set({ lastUpdate: event.timestamp });
                break;
            }

            case 'heartbeat': {
                set({ lastUpdate: event.timestamp });
                break;
            }

            case 'error': {
                set({ error: event.error, connectionState: 'error', isLoading: false });
                break;
            }
        }
    };

    const openStream = () => {
        closeStream();

        set((state) => ({
            connectionState: 'connecting',
            isLoading: state.entries.length === 0,
            error: null,
        }));

        const url = new URL(STREAM_URL, window.location.origin);
        url.searchParams.set('limit', String(STREAM_LIMIT));

        eventSource = new EventSource(url.toString());

        eventSource.addEventListener('message', (message) => {
            try {
                handleEvent(JSON.parse(message.data) as ActivityStreamEvent);
            } catch (error) {
                console.error('[Activity] Error parsing stream message:', error);
            }
        });

        eventSource.addEventListener('error', () => {
            closeStream();

            set({ isConnected: false, connectionState: 'error', isLoading: false });

            reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                openStream();
            }, RECONNECT_DELAY);
        });
    };

    return {
        entries: [],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        isConnected: false,
        connectionState: 'disconnected',
        lastUpdate: null,
        error: null,

        connect: () => {
            if (eventSource) return;

            openStream();
        },

        disconnect: () => {
            closeStream();
            resetOnNextInitialState = false;

            set({ isConnected: false, connectionState: 'disconnected' });
        },

        refresh: () => {
            openStream();
        },

        applyPurge: (purgedBefore) => {
            if (!purgedBefore) {
                resetOnNextInitialState = true;
                openStream();
                return;
            }

            set((state) => {
                const entries = state.entries.filter((entry) => entry.createdAt >= purgedBefore);

                if (entries.length === state.entries.length) return state;

                return { entries, hasMore: entries.length === 0 ? false : state.hasMore };
            });
        },

        loadMore: async () => {
            const { entries, hasMore, isLoadingMore } = get();
            const oldest = entries.at(-1);

            if (!hasMore || isLoadingMore || !oldest) return;

            set({ isLoadingMore: true });

            try {
                const params = new URLSearchParams({
                    pageSize: String(OLDER_PAGE_SIZE),
                    before: oldest.createdAt,
                });

                const page = await fetcherApi<ActivityLogPage>({ url: `/api/admin/activity?${params.toString()}` });

                set((state) => ({
                    entries: mergeEntries(state.entries, page.entries),
                    hasMore: page.entries.length === OLDER_PAGE_SIZE,
                    isLoadingMore: false,
                }));
            } catch (error) {
                console.error('[Activity] Failed to load older entries:', error);
                set({ isLoadingMore: false });
            }
        },
    };
});
