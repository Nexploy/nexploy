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
        swarmInspect: vi.fn(),
        swarmUpdate: vi.fn(),
    },
}));

vi.mock('@/managers/swarmStateManager', () => ({
    swarmStateManager: {
        getIsSwarmActive: vi.fn(),
        getSwarmInfo: vi.fn(),
        getAllNodes: vi.fn(),
        getAllServices: vi.fn(),
        getAllTasks: vi.fn(),
        getSwarmStats: vi.fn(),
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

describe('GET /api/swarm/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns full swarm state', async () => {
        vi.mocked(swarmStateManager.getIsSwarmActive).mockReturnValue(true);
        vi.mocked(swarmStateManager.getSwarmInfo).mockReturnValue({ ID: 'swarm1' } as any);
        vi.mocked(swarmStateManager.getAllNodes).mockReturnValue([{ ID: 'node1' }] as any);
        vi.mocked(swarmStateManager.getAllServices).mockReturnValue([{ ID: 'svc1' }] as any);
        vi.mocked(swarmStateManager.getAllTasks).mockReturnValue([{ ID: 'task1' }] as any);

        const res = await app.request('/api/swarm');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.isSwarmActive).toBe(true);
        expect(json.swarmInfo).toEqual({ ID: 'swarm1' });
        expect(json.nodes).toHaveLength(1);
        expect(json.services).toHaveLength(1);
        expect(json.tasks).toHaveLength(1);
    });
});

describe('GET /api/swarm/info', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns swarm info only', async () => {
        vi.mocked(swarmStateManager.getIsSwarmActive).mockReturnValue(false);
        vi.mocked(swarmStateManager.getSwarmInfo).mockReturnValue(null as any);

        const res = await app.request('/api/swarm/info');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.isSwarmActive).toBe(false);
        expect(json.swarmInfo).toBeNull();
        // Should NOT include nodes/services/tasks
        expect(json.nodes).toBeUndefined();
    });
});

describe('GET /api/swarm/stats', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns swarm statistics', async () => {
        const stats = { nodeCount: 3, serviceCount: 5, taskCount: 10 };
        vi.mocked(swarmStateManager.getSwarmStats).mockReturnValue(stats as any);

        const res = await app.request('/api/swarm/stats');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(stats);
    });
});

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

        const res = await app.request('/api/swarm/leave', { method: 'POST' });
        expect(res.status).toBe(200);
    });
});

describe('GET /api/swarm/join-tokens', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns worker and manager join tokens', async () => {
        vi.mocked(docker.swarmInspect).mockResolvedValue({
            JoinTokens: {
                Worker: 'SWMTKN-worker-token',
                Manager: 'SWMTKN-manager-token',
            },
        } as any);

        const res = await app.request('/api/swarm/join-tokens');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.worker).toBe('SWMTKN-worker-token');
        expect(json.manager).toBe('SWMTKN-manager-token');
    });

    it('returns empty strings when JoinTokens are undefined', async () => {
        vi.mocked(docker.swarmInspect).mockResolvedValue({ JoinTokens: undefined } as any);

        const res = await app.request('/api/swarm/join-tokens');
        const json = await res.json();

        expect(json.worker).toBe('');
        expect(json.manager).toBe('');
    });
});

describe('POST /api/swarm/rotate-tokens', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rotates tokens and returns new ones', async () => {
        vi.mocked(docker.swarmInspect)
            .mockResolvedValueOnce({
                JoinTokens: { Worker: 'old-worker', Manager: 'old-manager' },
                Spec: {},
                Version: { Index: 1 },
            } as any)
            .mockResolvedValueOnce({
                JoinTokens: { Worker: 'new-worker', Manager: 'new-manager' },
            } as any);
        vi.mocked(docker.swarmUpdate).mockResolvedValue(undefined as any);

        const res = await app.request('/api/swarm/rotate-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rotateWorker: true, rotateManager: true }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.worker).toBe('new-worker');
        expect(json.manager).toBe('new-manager');
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
