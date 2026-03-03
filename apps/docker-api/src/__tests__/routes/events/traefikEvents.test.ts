import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import traefikEventsRoute from '@/routes/events/traefikEvents';

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
    getRequests: vi.fn().mockReturnValue([]),
});

vi.mock('@/managers/traefikLogsManager', () => ({
    getTraefikLogsManager: vi.fn(() => mockManager),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/traefik', traefikEventsRoute);

describe('GET /api/traefik/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        mockManager.getRequests.mockReturnValue([]);
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends initial-state with request log on connect', async () => {
        const requests = [
            { method: 'GET', path: '/api/test', status: 200 },
            { method: 'POST', path: '/api/data', status: 201 },
        ];
        mockManager.getRequests.mockReturnValue(requests);

        await app.request('/api/traefik/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.type).toBe('initial');
        expect(data.requests).toEqual(requests);
    });

    it('sends empty requests array when no logs exist', async () => {
        mockManager.getRequests.mockReturnValue([]);

        await app.request('/api/traefik/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.requests).toEqual([]);
    });

    it('forwards request events from manager to stream', async () => {
        await app.request('/api/traefik/stream');
        await capturedStreamFn!(mockStream);

        const reqEvent = {
            type: 'request',
            request: { method: 'GET', path: '/health', status: 200 },
            timestamp: 1,
        };
        mockManager.emit('request', reqEvent);

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('request');

        const [reqFrame] = writeSSE.mock.calls.find(([f]) => f.event === 'request')!;
        const data = JSON.parse(reqFrame.data);
        expect(data.request.path).toBe('/health');
    });

    it('forwards clear events from manager to stream', async () => {
        await app.request('/api/traefik/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('clear', { type: 'clear', timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('clear');
    });

    it('removes all event listeners on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/traefik/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('request')).toBeGreaterThan(0);

        controller.abort();

        expect(mockManager.listenerCount('request')).toBe(0);
        expect(mockManager.listenerCount('clear')).toBe(0);
    });
});
