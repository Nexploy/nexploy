import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import volumesEventsRoute from '@/routes/events/volumesEvents';

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
    getAllVolumes: vi.fn().mockReturnValue([]),
});

vi.mock('@/managers/volumesStateManager', () => ({
    getVolumesStateManager: vi.fn(() => mockManager),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/volumes', volumesEventsRoute);

describe('GET /api/volumes/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        mockManager.getAllVolumes.mockReturnValue([]);
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends initial-state with volume list on connect', async () => {
        const volumes = [{ Name: 'my-vol', Driver: 'local' }];
        mockManager.getAllVolumes.mockReturnValue(volumes);

        await app.request('/api/volumes/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.volumes).toEqual(volumes);
        expect(data.type).toBe('initial');
    });

    it('forwards volume-added events to stream', async () => {
        await app.request('/api/volumes/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('volume-added', { type: 'volume-added', volume: { Name: 'v1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('volume-added');
    });

    it('forwards volume-updated events to stream', async () => {
        await app.request('/api/volumes/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('volume-updated', { type: 'volume-updated', volume: { Name: 'v1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('volume-updated');
    });

    it('forwards volume-removed events to stream', async () => {
        await app.request('/api/volumes/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('volume-removed', { type: 'volume-removed', volumeName: 'v1', timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('volume-removed');
    });

    it('forwards state-change events to stream', async () => {
        await app.request('/api/volumes/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('state-change', { type: 'state-change', volumes: [], timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('state-change');
    });

    it('removes all event listeners on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/volumes/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('volume-added')).toBeGreaterThan(0);

        controller.abort();

        expect(mockManager.listenerCount('state-change')).toBe(0);
        expect(mockManager.listenerCount('volume-added')).toBe(0);
        expect(mockManager.listenerCount('volume-updated')).toBe(0);
        expect(mockManager.listenerCount('volume-removed')).toBe(0);
    });
});
