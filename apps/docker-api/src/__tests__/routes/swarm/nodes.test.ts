import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { swarmStateManager } from '@/managers/swarmStateManager';
import nodeRoutes from '@/routes/swarm/nodeRoutes';

const app = new Hono();
app.route('/api/swarm/nodes', nodeRoutes);

const NODE = {
    ID: 'node1',
    Spec: { Role: 'worker', Availability: 'active', Labels: { env: 'prod' } },
    Version: { Index: 10 },
};

const mockNode = {
    inspect: vi.fn(),
    update: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        getNode: vi.fn(),
    },
}));

vi.mock('@/managers/swarmStateManager', () => ({
    swarmStateManager: {
        getNode: vi.fn(),
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

describe('POST /api/swarm/nodes/:id/promote', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getNode).mockReturnValue({ ...NODE } as any);
    });

    it('promotes a worker to manager', async () => {
        mockNode.inspect.mockResolvedValue({ ...NODE, Spec: { ...NODE.Spec, Role: 'worker' } });

        const res = await app.request('/api/swarm/nodes/node1/promote', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockNode.update).toHaveBeenCalledWith(expect.objectContaining({ Role: 'manager' }));
    });

    it('returns 400 if node is already a manager', async () => {
        mockNode.inspect.mockResolvedValue({ ...NODE, Spec: { ...NODE.Spec, Role: 'manager' } });

        const res = await app.request('/api/swarm/nodes/node1/promote', { method: 'POST' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/swarm/nodes/:id/demote', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getNode).mockReturnValue({ ...NODE } as any);
    });

    it('demotes a manager to worker', async () => {
        mockNode.inspect.mockResolvedValue({ ...NODE, Spec: { ...NODE.Spec, Role: 'manager' } });

        const res = await app.request('/api/swarm/nodes/node1/demote', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockNode.update).toHaveBeenCalledWith(expect.objectContaining({ Role: 'worker' }));
    });

    it('returns 400 if node is already a worker', async () => {
        mockNode.inspect.mockResolvedValue({ ...NODE, Spec: { ...NODE.Spec, Role: 'worker' } });

        const res = await app.request('/api/swarm/nodes/node1/demote', { method: 'POST' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/swarm/nodes/:id/drain', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.inspect.mockResolvedValue(NODE);
        mockNode.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getNode).mockReturnValue({ ...NODE } as any);
    });

    it('sets node availability to drain', async () => {
        const res = await app.request('/api/swarm/nodes/node1/drain', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockNode.update).toHaveBeenCalledWith(
            expect.objectContaining({ Availability: 'drain' }),
        );
    });
});

describe('POST /api/swarm/nodes/:id/activate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.inspect.mockResolvedValue(NODE);
        mockNode.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getNode).mockReturnValue({ ...NODE } as any);
    });

    it('sets node availability to active', async () => {
        const res = await app.request('/api/swarm/nodes/node1/activate', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockNode.update).toHaveBeenCalledWith(
            expect.objectContaining({ Availability: 'active' }),
        );
    });
});

describe('POST /api/swarm/nodes/:id/pause', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.inspect.mockResolvedValue(NODE);
        mockNode.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getNode).mockReturnValue({ ...NODE } as any);
    });

    it('sets node availability to pause', async () => {
        const res = await app.request('/api/swarm/nodes/node1/pause', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockNode.update).toHaveBeenCalledWith(
            expect.objectContaining({ Availability: 'pause' }),
        );
    });
});

