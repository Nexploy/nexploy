import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import dockerStatusEventsRoute from '@/routes/events/dockerStatusEvents';

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
    getStatus: vi.fn().mockReturnValue('connected'),
    isConnected: vi.fn().mockReturnValue(true),
    getLastCheck: vi.fn().mockReturnValue(Date.now()),
});

vi.mock('@/managers/dockerStatusManager', () => ({
    getDockerStatusManager: vi.fn(() => mockManager),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/docker-status', dockerStatusEventsRoute);

describe('GET /api/docker-status/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        mockManager.getStatus.mockReturnValue('connected');
        mockManager.isConnected.mockReturnValue(true);
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends initial-state with current docker status on connect', async () => {
        mockManager.getStatus.mockReturnValue('disconnected');
        mockManager.isConnected.mockReturnValue(false);

        await app.request('/api/docker-status/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.type).toBe('initial');
        expect(data.status).toBe('disconnected');
        expect(data.isConnected).toBe(false);
    });

    it('reads status from manager at connect time', async () => {
        mockManager.getStatus.mockReturnValue('connected');
        mockManager.isConnected.mockReturnValue(true);

        await app.request('/api/docker-status/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.status).toBe('connected');
        expect(data.isConnected).toBe(true);
    });

    it('forwards status-changed events from manager to stream', async () => {
        await app.request('/api/docker-status/stream');
        await capturedStreamFn!(mockStream);

        const statusEvent = {
            type: 'status-changed',
            status: 'disconnected',
            isConnected: false,
            timestamp: Date.now(),
        };
        mockManager.emit('status-changed', statusEvent);

        const events = writeSSE.mock.calls.map(([f]) => f.event);
        expect(events).toContain('status-changed');

        const [statusFrame] = writeSSE.mock.calls.find(([f]) => f.event === 'status-changed')!;
        const data = JSON.parse(statusFrame.data);
        expect(data.status).toBe('disconnected');
    });

    it('removes status-changed listener on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/docker-status/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('status-changed')).toBe(1);

        controller.abort();

        expect(mockManager.listenerCount('status-changed')).toBe(0);
    });

    it('does not forward events after abort', async () => {
        const controller = new AbortController();
        await app.request('/api/docker-status/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        controller.abort();

        const beforeCount = writeSSE.mock.calls.length;
        mockManager.emit('status-changed', { type: 'status-changed', status: 'disconnected', timestamp: 1 });

        // No new frames after cleanup
        expect(writeSSE.mock.calls.length).toBe(beforeCount);
    });
});
