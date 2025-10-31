export interface DockerEventData {
    Type: string;
    Action: string;
    Actor: {
        ID: string;
        Attributes: Record<string, string>;
    };
    scope?: string;
    time: number;
    timeNano: number;
}

export interface EventsStateEvent {
    type: 'event';
    event: DockerEventData;
    timestamp: number;
}

export interface EventsStateStats {
    eventStreamActive: boolean;
    reconnectAttempts: number;
    listening: boolean;
    eventsReceived: number;
    lastEventTime: number | null;
}
