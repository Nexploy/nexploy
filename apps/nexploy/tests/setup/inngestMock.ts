export interface RecordedInngestEvent {
    name: string;
    data?: Record<string, unknown>;
}

export const inngestEvents: RecordedInngestEvent[] = [];

export function resetInngestMock() {
    inngestEvents.length = 0;
}

export function eventsNamed(name: string): RecordedInngestEvent[] {
    return inngestEvents.filter((event) => event.name === name);
}

export const inngestMock = {
    id: 'nexploy-tests',
    send: async (payload: RecordedInngestEvent | RecordedInngestEvent[]) => {
        const events = Array.isArray(payload) ? payload : [payload];
        inngestEvents.push(...events);

        return { ids: events.map((_, index) => `test-event-${index}`) };
    },
    createFunction: (_config: unknown, _trigger: unknown, handler: unknown) => ({ handler }),
    setEnvVars: () => inngestMock,
};
