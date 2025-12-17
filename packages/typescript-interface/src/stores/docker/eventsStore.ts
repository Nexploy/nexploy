import { DockerEventData } from '../../docker/docker.events';

interface EventFilter {
    types?: string[];
    actions?: string[];
    actorIds?: string[];
    search?: string;
}

export interface EventsState {
    events: DockerEventData[];
    filteredEvents: DockerEventData[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    filter: EventFilter;
    maxEvents: number;
    eventsReceived: number;
    lastEventTime: number | null;

    searchQuery: string;
    typeFilter: string;
    setSearchQuery: (query: string) => void;
    setTypeFilter: (type: string) => void;

    setEvents: (events: DockerEventData[]) => void;
    addEvent: (event: DockerEventData) => void;
    clearEvents: () => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    setFilter: (filter: EventFilter) => void;
    setMaxEvents: (max: number) => void;
    applyFilter: () => void;

    getEventsByType: (type: string) => DockerEventData[];
    getEventsByAction: (action: string) => DockerEventData[];
    getEventsByActorId: (actorId: string) => DockerEventData[];
    getRecentEvents: (count: number) => DockerEventData[];

    connect: (filter?: EventFilter) => void;
    disconnect: () => void;
    reset: () => void;
}
