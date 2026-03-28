import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { swarmStateManager } from '@/managers/swarmStateManager';
import swarmRoutes from '@/routes/swarm/swarmRoutes';

const app = new Hono();
app.route('/api/swarm', swarmRoutes);

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        swarmInit: vi.fn(),
        swarmJoin: vi.fn(),
        swarmLeave: vi.fn(),
    },
}));

vi.mock('@/managers/swarmStateManager', () => ({
    swarmStateManager: {
        hardRefresh: vi.fn(),
    },
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe('POST /api/swarm/init', () => {
    beforeEach(() => vi.clearAllMocks());

    it('initializes swarm and returns nodeId', async () => {
        vi.mocked(docker.swarmInit).mockResolvedValue('node-id-1' as any);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);

        const res = await app.request('/api/swarm/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ advertiseAddr: '192.168.1.1:2377' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.nodeId).toBe('node-id-1');
        expect(docker.swarmInit).toHaveBeenCalledWith({
            AdvertiseAddr: '192.168.1.1:2377',
            ListenAddr: '0.0.0.0:2377',
            ForceNewCluster: false,
        });
    });

    it('returns 400 when advertiseAddr is missing', async () => {
        const res = await app.request('/api/swarm/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/swarm/join', () => {
    beforeEach(() => vi.clearAllMocks());

    it('joins an existing swarm', async () => {
        vi.mocked(docker.swarmJoin).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);

        const res = await app.request('/api/swarm/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                remoteAddrs: ['192.168.1.1:2377'],
                joinToken: 'SWMTKN-1-xxx',
            }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
    });

    it('returns 400 when remoteAddrs is empty', async () => {
        const res = await app.request('/api/swarm/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remoteAddrs: [], joinToken: 'SWMTKN-1' }),
        });

        expect(res.status).toBe(400);
    });

    it('returns 400 when joinToken is missing', async () => {
        const res = await app.request('/api/swarm/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remoteAddrs: ['192.168.1.1:2377'] }),
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/swarm/leave', () => {
    beforeEach(() => vi.clearAllMocks());

    it('leaves swarm without force', async () => {
        vi.mocked(docker.swarmLeave).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);

        const res = await app.request('/api/swarm/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: false }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(docker.swarmLeave).toHaveBeenCalledWith({ force: false });
    });

    it('handles missing body gracefully', async () => {
        vi.mocked(docker.swarmLeave).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);

        const res = await app.request('/api/swarm/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(200);
    });
});

describe('POST /api/swarm/hardRefresh', () => {
    beforeEach(() => vi.clearAllMocks());

    it('refreshes swarm state and returns success', async () => {
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);

        const res = await app.request('/api/swarm/hardRefresh', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(swarmStateManager.hardRefresh).toHaveBeenCalledOnce();
    });
});
