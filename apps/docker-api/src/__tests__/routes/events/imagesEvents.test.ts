import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import imagesEventsRoute from '@/routes/events/imagesEvents';

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
    getAllImages: vi.fn().mockReturnValue([]),
});

vi.mock('@/managers/imagesStateManager', () => ({
    getImagesStateManager: vi.fn(() => mockManager),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/images', imagesEventsRoute);

describe('GET /api/images/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        mockManager.getAllImages.mockReturnValue([]);
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends initial-state with image list on connect', async () => {
        const images = [{ id: 'img1', RepoTags: ['nginx:latest'] }];
        mockManager.getAllImages.mockReturnValue(images);

        await app.request('/api/images/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.images).toEqual(images);
        expect(data.type).toBe('initial');
    });

    it('forwards image-added events to stream', async () => {
        await app.request('/api/images/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('image-added', { type: 'image-added', image: { id: 'img1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('image-added');
    });

    it('forwards image-updated events to stream', async () => {
        await app.request('/api/images/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('image-updated', { type: 'image-updated', image: { id: 'img1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('image-updated');
    });

    it('forwards image-removed events to stream', async () => {
        await app.request('/api/images/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('image-removed', { type: 'image-removed', imageId: 'img1', timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('image-removed');
    });

    it('forwards state-change events to stream', async () => {
        await app.request('/api/images/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('state-change', { type: 'state-change', images: [], timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('state-change');
    });

    it('removes all event listeners on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/images/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('image-added')).toBeGreaterThan(0);

        controller.abort();

        expect(mockManager.listenerCount('state-change')).toBe(0);
        expect(mockManager.listenerCount('image-added')).toBe(0);
        expect(mockManager.listenerCount('image-updated')).toBe(0);
        expect(mockManager.listenerCount('image-removed')).toBe(0);
    });
});
