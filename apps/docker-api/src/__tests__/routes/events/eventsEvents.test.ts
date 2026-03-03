import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import eventsEventsRoute from '@/routes/events/eventsEvents';

const writeSSE = vi.fn().mockResolvedValue(undefined);
const mockStream = {
    writeSSE,
    sleep: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
};

let capturedStreamFn: ((stream: any) => Promise<void>) | null = null;

vi.mock('hono/streaming', () => ({
    streamSSE: vi.fn((_c: any, fn: any) => {
        capturedStreamFn = fn;
        return new Response(null, { status: 200 });
    }),
}));

const mockManager = Object.assign(new EventEmitter(), {
    getStats: vi.fn().mockReturnValue({ total: 0, byType: {} }),
    getAllEvents: vi.fn().mockReturnValue([]),
});

vi.mock('@/managers/eventsStateManager', () => ({
    getEventsStateManager: vi.fn(() => mockManager),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/events', eventsEventsRoute);

describe('GET /api/events/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends initial-state with events and stats on connect', async () => {
        mockManager.getStats.mockReturnValue({ total: 5, byType: { container: 5 } });
        mockManager.getAllEvents.mockReturnValue([{ Action: 'start', Type: 'container' }]);

        await app.request('/api/events/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.type).toBe('initial');
        expect(data.stats.total).toBe(5);
        expect(data.events).toHaveLength(1);
    });

    it('forwards docker-event from manager to stream', async () => {
        await app.request('/api/events/stream');
        await capturedStreamFn!(mockStream);

        const dockerEvent = { Action: 'start', Type: 'container', Actor: { ID: 'c1' } };
        mockManager.emit('docker-event', dockerEvent);

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('docker-event');

        const [eventFrame] = writeSSE.mock.calls.find(([f]) => f.event === 'docker-event')!;
        const data = JSON.parse(eventFrame.data);
        expect(data.Action).toBe('start');
    });

    it('removes docker-event listener on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/events/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('docker-event')).toBe(1);

        controller.abort();

        expect(mockManager.listenerCount('docker-event')).toBe(0);
    });
});

describe('GET /api/events/stream/:eventType (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends initial-state with eventType on connect', async () => {
        await app.request('/api/events/stream/container');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.eventType).toBe('container');
    });

    it('forwards filtered docker events with typed event name', async () => {
        await app.request('/api/events/stream/container');
        await capturedStreamFn!(mockStream);

        mockManager.emit('docker-event:container', { Action: 'start', Type: 'container' });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('docker-event-container');
    });

    it('removes typed listener on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/events/stream/container', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('docker-event:container')).toBe(1);

        controller.abort();

        expect(mockManager.listenerCount('docker-event:container')).toBe(0);
    });
});

describe('GET /api/events/stream/:eventType/:action (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends initial-state with eventType and action on connect', async () => {
        await app.request('/api/events/stream/container/start');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.eventType).toBe('container');
        expect(data.action).toBe('start');
    });

    it('forwards action-filtered events with typed event name', async () => {
        await app.request('/api/events/stream/container/start');
        await capturedStreamFn!(mockStream);

        mockManager.emit('docker-event:container:start', { Action: 'start', Type: 'container' });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('docker-event-container-start');
    });

    it('removes action-filtered listener on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/events/stream/container/start', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('docker-event:container:start')).toBe(1);

        controller.abort();

        expect(mockManager.listenerCount('docker-event:container:start')).toBe(0);
    });
});
