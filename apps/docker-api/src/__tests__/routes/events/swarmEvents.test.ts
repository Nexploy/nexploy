import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import swarmEventsRoute from '@/routes/events/swarmEvents';

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
    getIsSwarmActive: vi.fn().mockReturnValue(false),
    getSwarmInfo: vi.fn().mockReturnValue(null),
    getAllNodes: vi.fn().mockReturnValue([]),
    getAllServices: vi.fn().mockReturnValue([]),
    getAllTasks: vi.fn().mockReturnValue([]),
});

vi.mock('@/managers/swarmStateManager', () => ({
    getSwarmStateManager: vi.fn(() => mockManager),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/swarm', swarmEventsRoute);

describe('GET /api/swarm/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        mockManager.getIsSwarmActive.mockReturnValue(false);
        writeSSE.mockResolvedValue(undefined);
    });

    it('sends not-in-swarm initial-state when swarm is inactive', async () => {
        mockManager.getIsSwarmActive.mockReturnValue(false);

        await app.request('/api/swarm/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.type).toBe('not-in-swarm');
        expect(data.isSwarmActive).toBe(false);
    });

    it('sends full swarm state in initial-state when swarm is active', async () => {
        mockManager.getIsSwarmActive.mockReturnValue(true);
        mockManager.getSwarmInfo.mockReturnValue({ ID: 'swarm1', Spec: {} });
        mockManager.getAllNodes.mockReturnValue([{ ID: 'node1' }]);
        mockManager.getAllServices.mockReturnValue([{ ID: 'svc1' }]);
        mockManager.getAllTasks.mockReturnValue([{ ID: 'task1' }]);

        await app.request('/api/swarm/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.type).toBe('initial');
        expect(data.isSwarmActive).toBe(true);
        expect(data.nodes).toHaveLength(1);
        expect(data.services).toHaveLength(1);
        expect(data.tasks).toHaveLength(1);
    });

    it('forwards node-added events to stream', async () => {
        await app.request('/api/swarm/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('node-added', { type: 'node-added', node: { ID: 'n1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('node-added');
    });

    it('forwards node-updated events to stream', async () => {
        await app.request('/api/swarm/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('node-updated', { type: 'node-updated', node: { ID: 'n1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('node-updated');
    });

    it('forwards node-removed events to stream', async () => {
        await app.request('/api/swarm/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('node-removed', { type: 'node-removed', nodeId: 'n1', timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('node-removed');
    });

    it('forwards service-added events to stream', async () => {
        await app.request('/api/swarm/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('service-added', { type: 'service-added', service: { ID: 's1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('service-added');
    });

    it('forwards task-updated events to stream', async () => {
        await app.request('/api/swarm/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('task-updated', { type: 'task-updated', task: { ID: 't1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('task-updated');
    });

    it('removes all event listeners on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/swarm/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('node-added')).toBeGreaterThan(0);

        controller.abort();

        expect(mockManager.listenerCount('node-added')).toBe(0);
        expect(mockManager.listenerCount('service-added')).toBe(0);
        expect(mockManager.listenerCount('task-added')).toBe(0);
        expect(mockManager.listenerCount('swarm-updated')).toBe(0);
    });
});
