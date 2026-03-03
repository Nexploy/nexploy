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
    remove: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        getNode: vi.fn(),
    },
}));

vi.mock('@/managers/swarmStateManager', () => ({
    swarmStateManager: {
        getAllNodes: vi.fn(),
        getNode: vi.fn(),
        getTasksByNode: vi.fn(),
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

describe('GET /api/swarm/nodes/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all nodes', async () => {
        vi.mocked(swarmStateManager.getAllNodes).mockReturnValue([NODE] as any);

        const res = await app.request('/api/swarm/nodes');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.nodes).toEqual([NODE]);
    });
});

describe('GET /api/swarm/nodes/:id', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns node with its tasks', async () => {
        vi.mocked(swarmStateManager.getNode).mockReturnValue(NODE as any);
        vi.mocked(swarmStateManager.getTasksByNode).mockReturnValue([{ ID: 't1' }] as any);

        const res = await app.request('/api/swarm/nodes/node1');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.node).toEqual(NODE);
        expect(json.tasks).toHaveLength(1);
    });

    it('returns 404 when node not found', async () => {
        vi.mocked(swarmStateManager.getNode).mockReturnValue(null as any);

        const res = await app.request('/api/swarm/nodes/notexist');
        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/swarm/nodes/:id', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.inspect.mockResolvedValue(NODE);
        mockNode.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getNode).mockReturnValue({
            ...NODE,
            Spec: { ...NODE.Spec, Availability: 'Drain' },
        } as any);
    });

    it('updates node availability', async () => {
        const res = await app.request('/api/swarm/nodes/node1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availability: 'drain' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockNode.update).toHaveBeenCalledWith(
            expect.objectContaining({ Availability: 'Drain' }),
        );
    });

    it('updates node role', async () => {
        await app.request('/api/swarm/nodes/node1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'manager' }),
        });

        expect(mockNode.update).toHaveBeenCalledWith(expect.objectContaining({ Role: 'Manager' }));
    });

    it('updates node labels', async () => {
        await app.request('/api/swarm/nodes/node1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels: { region: 'eu' } }),
        });

        expect(mockNode.update).toHaveBeenCalledWith(
            expect.objectContaining({ Labels: { region: 'eu' } }),
        );
    });
});

describe('DELETE /api/swarm/nodes/:id', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.remove.mockResolvedValue(undefined);
    });

    it('removes node from swarm', async () => {
        const res = await app.request('/api/swarm/nodes/node1', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: false }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.nodeId).toBe('node1');
        expect(mockNode.remove).toHaveBeenCalledWith({ force: false });
    });
});

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

describe('PUT /api/swarm/nodes/:id/labels', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNode).mockReturnValue(mockNode as any);
        mockNode.inspect.mockResolvedValue(NODE);
        mockNode.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getNode).mockReturnValue({ ...NODE } as any);
    });

    it('merges labels when merge=true (default)', async () => {
        const res = await app.request('/api/swarm/nodes/node1/labels', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels: { region: 'eu' }, merge: true }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockNode.update).toHaveBeenCalledWith(
            expect.objectContaining({ Labels: { env: 'prod', region: 'eu' } }),
        );
    });

    it('replaces labels when merge=false', async () => {
        await app.request('/api/swarm/nodes/node1/labels', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels: { region: 'eu' }, merge: false }),
        });

        expect(mockNode.update).toHaveBeenCalledWith(
            expect.objectContaining({ Labels: { region: 'eu' } }),
        );
    });
});
