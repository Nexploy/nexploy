import { create } from 'zustand';

import { EventsStateEvent } from '@workspace/typescript-interface/docker/docker.events';
import { EventsState } from '@workspace/typescript-interface/stores/eventsStore';

export const useEventsStore = create<EventsState>((set, get) => ({
    events: [],
    filteredEvents: [],
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,
    filter: {},
    maxEvents: 1000,
    eventsReceived: 0,
    lastEventTime: null,

    searchQuery: '',
    typeFilter: 'all',

    setSearchQuery: (query) => {
        set({ searchQuery: query });
        const { typeFilter } = get();
        const types = typeFilter !== 'all' ? [typeFilter] : undefined;
        const search = query.trim() || undefined;
        get().setFilter({ types, search });
    },

    setTypeFilter: (type) => {
        set({ typeFilter: type });
        const { searchQuery } = get();
        const types = type !== 'all' ? [type] : undefined;
        const search = searchQuery.trim() || undefined;
        get().setFilter({ types, search });
    },

    setEvents: (events) => {
        set({ events });
        get().applyFilter();
    },

    addEvent: (event) =>
        set((state) => {
            const newEvents = [event, ...state.events];

            if (newEvents.length > state.maxEvents) {
                newEvents.splice(state.maxEvents);
            }

            const newState = {
                events: newEvents,
                eventsReceived: state.eventsReceived + 1,
                lastEventTime: Date.now(),
            };

            get().applyFilter();

            return newState;
        }),

    clearEvents: () => set({ events: [], filteredEvents: [], eventsReceived: 0 }),

    setError: (error) => set({ error }),

    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    setFilter: (filter) => {
        set({ filter });
        get().applyFilter();
    },

    setMaxEvents: (maxEvents) => {
        set({ maxEvents });

        const state = get();
        if (state.events.length > maxEvents) {
            set({ events: state.events.slice(0, maxEvents) });
            get().applyFilter();
        }
    },

    applyFilter: () => {
        const { events, filter } = get();

        let filtered = events;

        if (filter.types && filter.types.length > 0) {
            filtered = filtered.filter((event) => filter.types!.includes(event.Type));
        }

        if (filter.actions && filter.actions.length > 0) {
            filtered = filtered.filter((event) => filter.actions!.includes(event.Action));
        }

        if (filter.actorIds && filter.actorIds.length > 0) {
            filtered = filtered.filter((event) => filter.actorIds!.includes(event.Actor.ID));
        }

        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filtered = filtered.filter((event) => {
                const name = event.Actor.Attributes?.name?.toLowerCase() || '';
                const id = event.Actor.ID.toLowerCase();
                const action = event.Action.toLowerCase();
                const type = event.Type.toLowerCase();

                return (
                    name.includes(searchLower) ||
                    id.includes(searchLower) ||
                    action.includes(searchLower) ||
                    type.includes(searchLower)
                );
            });
        }

        set({ filteredEvents: filtered });
    },

    getEventsByType: (type) => {
        return get().events.filter((event) => event.Type === type);
    },

    getEventsByAction: (action) => {
        return get().events.filter((event) => event.Action === action);
    },

    getEventsByActorId: (actorId) => {
        return get().events.filter((event) => event.Actor.ID === actorId);
    },

    getRecentEvents: (count) => {
        return get().filteredEvents.slice(0, count);
    },

    connect: (filter) => {
        const state = get();

        if (filter) {
            set({ filter });
        }

        if (state.eventSource) {
            state.eventSource.close();
        }
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const url = new URL('/api/events/stream', window.location.origin);

            if (filter?.types && filter.types.length === 1) {
                url.href = `/api/events/events/stream/${filter.types[0]}`;

                if (filter.actions && filter.actions.length === 1) {
                    url.href = `/api/events/events/stream/${filter.types[0]}/${filter.actions[0]}`;
                }
            }

            url.searchParams.set('endpoint', '/api/events/events/stream');

            const eventSource = new EventSource(url.toString());

            eventSource.addEventListener('open', () => {
                console.log('SSE Events connection established');
                set({ error: null, eventSource });
            });

            eventSource.addEventListener('initial-state', (e) => {
                const data = JSON.parse(e.data);
                console.log('Events - Initial state received:', data);

                get().setEvents(event);

                set({
                    lastUpdate: data.timestamp,
                    eventsReceived: data.stats?.eventsReceived || 0,
                    lastEventTime: data.stats?.lastEventTime || null,
                });
            });

            eventSource.addEventListener('heartbeat', (e) => {
                const data = JSON.parse(e.data);
                set({
                    lastUpdate: data.timestamp,
                    eventsReceived: data.stats?.eventsReceived || get().eventsReceived,
                    lastEventTime: data.stats?.lastEventTime || get().lastEventTime,
                });
            });

            eventSource.addEventListener('docker-event', (e) => {
                const data: EventsStateEvent = JSON.parse(e.data);
                const event = data.event;

                get().addEvent(event);

                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('docker-event-container', (e) => {
                const data: EventsStateEvent = JSON.parse(e.data);
                get().addEvent(data.event);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('docker-event-image', (e) => {
                const data: EventsStateEvent = JSON.parse(e.data);
                get().addEvent(data.event);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('docker-event-network', (e) => {
                const data: EventsStateEvent = JSON.parse(e.data);
                get().addEvent(data.event);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('docker-event-volume', (e) => {
                const data: EventsStateEvent = JSON.parse(e.data);
                get().addEvent(data.event);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('error', () => {
                const currentEventSource = get().eventSource;

                if (currentEventSource) {
                    currentEventSource.close();
                    set({ eventSource: null });
                }

                set({ error: new Error('Error connecting to Docker Events') });

                const timeout = setTimeout(() => {
                    console.log('Attempting to reconnect to Events...');
                    get().connect(filter);
                }, 5000);

                set({ reconnectTimeout: timeout });
            });

            set({ eventSource });
        } catch (err) {
            console.error('Events - Failed to connect:', err);
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
