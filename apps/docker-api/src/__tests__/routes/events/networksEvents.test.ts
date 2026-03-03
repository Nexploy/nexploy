import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { EventEmitter } from 'events';
import networksEventsRoute from '@/routes/events/networksEvents';
import {
    filterNexployNetworks,
    isNexployInfrastructureNetwork,
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
    getAllNetworks: vi.fn().mockReturnValue([]),
});

vi.mock('@/managers/networksStateManager', () => ({
    getNetworksStateManager: vi.fn(() => mockManager),
}));

vi.mock('@workspace/shared/nexployFilter', () => ({
    filterNexployNetworks: vi.fn((networks: any[]) => networks),
    isNexployInfrastructureNetwork: vi.fn(() => false),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/networks', networksEventsRoute);

describe('GET /api/networks/stream (SSE)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedStreamFn = null;
        mockManager.removeAllListeners();
        mockManager.getAllNetworks.mockReturnValue([]);
        writeSSE.mockResolvedValue(undefined);
        vi.mocked(isNexployInfrastructureNetwork).mockReturnValue(false);
        vi.mocked(filterNexployNetworks).mockImplementation((n: any[]) => n);
    });

    it('sends initial-state with network list on connect', async () => {
        const networks = [{ Id: 'net1', Name: 'bridge' }];
        mockManager.getAllNetworks.mockReturnValue(networks);

        await app.request('/api/networks/stream');
        await capturedStreamFn!(mockStream);

        const [frame] = writeSSE.mock.calls.find(([f]) => f.event === 'initial-state')!;
        const data = JSON.parse(frame.data);
        expect(data.networks).toEqual(networks);
        expect(data.type).toBe('initial');
    });

    it('forwards network-added events to stream', async () => {
        await app.request('/api/networks/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('network-added', { type: 'network-added', network: { Id: 'net1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('network-added');
    });

    it('suppresses network-added for nexploy infrastructure networks', async () => {
        const { isNexployInfrastructureNetwork } = await import('@workspace/shared/nexployFilter');
        vi.mocked(isNexployInfrastructureNetwork).mockReturnValue(true);

        await app.request('/api/networks/stream');
        await capturedStreamFn!(mockStream);

        const before = writeSSE.mock.calls.length;
        mockManager.emit('network-added', {
            type: 'network-added',
            network: { Id: 'traefik-net' },
            timestamp: 1,
        });

        expect(writeSSE.mock.calls.length).toBe(before);
    });

    it('forwards network-updated events to stream', async () => {
        await app.request('/api/networks/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('network-updated', { type: 'network-updated', network: { Id: 'net1' }, timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('network-updated');
    });

    it('forwards network-removed events to stream', async () => {
        await app.request('/api/networks/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('network-removed', { type: 'network-removed', networkId: 'net1', timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('network-removed');
    });

    it('forwards state-change events to stream', async () => {
        await app.request('/api/networks/stream');
        await capturedStreamFn!(mockStream);

        mockManager.emit('state-change', { type: 'state-change', networks: [], timestamp: 1 });

        expect(writeSSE.mock.calls.map(([f]) => f.event)).toContain('state-change');
    });

    it('removes all event listeners on abort', async () => {
        const controller = new AbortController();
        await app.request('/api/networks/stream', { signal: controller.signal });
        await capturedStreamFn!(mockStream);

        expect(mockManager.listenerCount('network-added')).toBeGreaterThan(0);

        controller.abort();

        expect(mockManager.listenerCount('state-change')).toBe(0);
        expect(mockManager.listenerCount('network-added')).toBe(0);
        expect(mockManager.listenerCount('network-updated')).toBe(0);
        expect(mockManager.listenerCount('network-removed')).toBe(0);
    });
});
