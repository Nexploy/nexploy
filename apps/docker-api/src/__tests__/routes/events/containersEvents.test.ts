import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import containersEventsRoute from '@/routes/events/containersEvents';
import {
    filterNexployContainers,
    isNexployInfrastructureContainer,
} from '@workspace/shared/nexployFilter';

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
    getAllStates: vi.fn().mockReturnValue([]),
});

vi.mock('@/managers/containersStateManager', () => ({
    getContainersStateManager: vi.fn(() => mockManager),
}));

vi.mock('@workspace/shared/nexployFilter', () => ({
    filterNexployContainers: vi.fn((containers: any[]) => containers),
    isNexployInfrastructureContainer: vi.fn(() => false),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/containers', containersEventsRoute);

describe('GET /api/containers/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        mockManager.getAllStates.mockReturnValue([]);
        writeSSE.mockResolvedValue(undefined);
        vi.mocked(isNexployInfrastructureContainer).mockReturnValue(false);
        vi.mocked(filterNexployContainers).mockImplementation((c: any[]) => c);
    });

    it('invokes streamSSE and sends initial-state on connect', async () => {
        await app.request('/api/containers/stream');
        expect(capturedStreamFn).not.toBeNull();

        await capturedStreamFn!(mockStream);

        const events = writeSSE.mock.calls.map(([f]) => f.event);
        expect(events).toContain('initial-state');
    });

    it('includes filtered container list in initial-state', async () => {
        const containers = [{ id: 'c1', name: '/web' }];
        mockManager.getAllStates.mockReturnValue(containers);

        await app.request('/api/containers/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.containers).toEqual(containers);
    });

    it('forwards state-change events from manager to stream', async () => {
        await app.request('/api/containers/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('state-change', { type: 'state-change', containers: [], timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('state-change');
    });

    it('forwards container-added events to stream', async () => {
        await app.request('/api/containers/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('container-added', { type: 'container-added', container: { id: 'c1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('container-added');
    });

    it('suppresses container-added for nexploy infrastructure containers', async () => {
        const { isNexployInfrastructureContainer } = await import('@workspace/shared/nexployFilter');
        vi.mocked(isNexployInfrastructureContainer).mockReturnValue(true);

        await app.request('/api/containers/stream');
        await capturedStreamFn!(mockStream);

        const before = writeSSE.mock.calls.length;
        mockManager.emit('container-added', {
            type: 'container-added',
            container: { id: 'traefik' },
            timestamp: 1,
        });

        expect(writeSSE.mock.calls.length).toBe(before);
    });

    it('forwards container-updated events to stream', async () => {
        await app.request('/api/containers/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('container-updated', { type: 'container-updated', container: { id: 'c1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('container-updated');
    });

    it('forwards container-removed events to stream', async () => {
        await app.request('/api/containers/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('container-removed', { type: 'container-removed', container: { id: 'c1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('container-removed');
    });

    it('removes all event listeners when connection is aborted', async () => {
        const controller = new AbortController();
        await app.request('/api/containers/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('state-change')).toBeGreaterThan(0);

        controller.abort();

        expect(mockManager.listenerCount('state-change')).toBe(0);
        expect(mockManager.listenerCount('container-added')).toBe(0);
        expect(mockManager.listenerCount('container-updated')).toBe(0);
        expect(mockManager.listenerCount('container-removed')).toBe(0);
    });
});
