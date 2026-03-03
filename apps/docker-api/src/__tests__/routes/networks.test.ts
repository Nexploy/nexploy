import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { networksStateManager } from '@/managers/networksStateManager';
import { filterNexployNetworks } from '@workspace/shared/nexployFilter';
import networksRoutes from '@/routes/networksRoutes';

const app = new Hono();
app.route('/api/networks', networksRoutes);

const mockNetwork = {
    inspect: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    remove: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        getNetwork: vi.fn(),
        createNetwork: vi.fn(),
    },
}));

vi.mock('@/managers/networksStateManager', () => ({
    networksStateManager: {
        getAllNetworks: vi.fn(),
        getByName: vi.fn(),
        hardRefresh: vi.fn(),
    },
}));

vi.mock('@workspace/shared/nexployFilter', () => ({
    filterNexployNetworks: vi.fn((n: any[]) => n),
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe('GET /api/networks/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns filtered nexploy networks', async () => {
        const networks = [{ Id: 'n1', Name: 'web' }];
        vi.mocked(networksStateManager.getAllNetworks).mockReturnValue(networks as any);
        vi.mocked(filterNexployNetworks).mockReturnValue(networks as any);

        const res = await app.request('/api/networks');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(networks);
        expect(filterNexployNetworks).toHaveBeenCalledWith(networks);
    });
});

describe('POST /api/networks/hardRefresh', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls hardRefresh and returns result', async () => {
        vi.mocked(networksStateManager.hardRefresh).mockResolvedValue([{ Id: 'n1' }] as any);

        const res = await app.request('/api/networks/hardRefresh', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual([{ Id: 'n1' }]);
    });
});

describe('POST /api/networks/create', () => {
    beforeEach(() => vi.clearAllMocks());

    it('creates a network with default bridge driver', async () => {
        vi.mocked(networksStateManager.getByName).mockReturnValue(null as any);
        vi.mocked(docker.createNetwork).mockResolvedValue({ id: 'net123' } as any);

        const res = await app.request('/api/networks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'my-net' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ id: 'net123', name: 'my-net' });
        expect(docker.createNetwork).toHaveBeenCalledWith({
            Name: 'my-net',
            Driver: 'bridge',
        });
    });

    it('returns 400 when name is missing', async () => {
        const res = await app.request('/api/networks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });

    it('throws if network already exists', async () => {
        vi.mocked(networksStateManager.getByName).mockReturnValue({ Id: 'n1' } as any);

        const res = await app.request('/api/networks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'existing-net' }),
        });

        expect(res.status).toBe(500);
    });
});

describe('GET /api/networks/:id', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNetwork).mockReturnValue(mockNetwork as any);
    });

    it('returns network inspection data', async () => {
        const data = { Id: 'net123', Name: 'my-net' };
        mockNetwork.inspect.mockResolvedValue(data);

        const res = await app.request('/api/networks/net123');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(data);
        expect(docker.getNetwork).toHaveBeenCalledWith('net123');
    });
});

describe('POST /api/networks/:id/connect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNetwork).mockReturnValue(mockNetwork as any);
    });

    it('connects a container to a network', async () => {
        mockNetwork.connect.mockResolvedValue(undefined);

        const res = await app.request('/api/networks/net123/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ containerId: 'c1' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ networkId: 'net123', containerId: 'c1', connected: true });
        expect(mockNetwork.connect).toHaveBeenCalledWith({ Container: 'c1' });
    });

    it('returns 400 when containerId is missing', async () => {
        const res = await app.request('/api/networks/net123/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/networks/:id/disconnect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNetwork).mockReturnValue(mockNetwork as any);
    });

    it('disconnects a container from a network', async () => {
        mockNetwork.disconnect.mockResolvedValue(undefined);

        const res = await app.request('/api/networks/net123/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ containerId: 'c1', force: false }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ networkId: 'net123', containerId: 'c1', disconnected: true });
        expect(mockNetwork.disconnect).toHaveBeenCalledWith({ Container: 'c1', Force: false });
    });

    it('returns 400 when containerId is missing', async () => {
        const res = await app.request('/api/networks/net123/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/networks/delete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getNetwork).mockReturnValue(mockNetwork as any);
    });

    it('deletes a regular network', async () => {
        mockNetwork.inspect.mockResolvedValue({
            Id: 'n1',
            Name: 'my-net',
            Labels: {},
            Containers: {},
        });
        mockNetwork.remove.mockResolvedValue(undefined);

        const res = await app.request('/api/networks/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ networkIds: ['n1'], force: false }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.deleted).toContain('n1');
        expect(json.skipped).toHaveLength(0);
    });

    it('skips builtin networks (bridge, host, none)', async () => {
        mockNetwork.inspect.mockResolvedValue({
            Id: 'n1',
            Name: 'bridge',
            Labels: {},
            Containers: {},
        });

        const res = await app.request('/api/networks/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ networkIds: ['n1'], force: false }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.deleted).toHaveLength(0);
        expect(json.skipped[0].reason).toBe('builtin');
    });

    it('skips compose networks when force=false', async () => {
        mockNetwork.inspect.mockResolvedValue({
            Id: 'n1',
            Name: 'app_default',
            Labels: { 'com.docker.compose.project': 'app' },
            Containers: {},
        });

        const res = await app.request('/api/networks/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ networkIds: ['n1'], force: false }),
        });
        const json = await res.json();

        expect(json.skipped[0].reason).toBe('compose_stack');
    });

    it('skips networks with connected containers when force=false', async () => {
        mockNetwork.inspect.mockResolvedValue({
            Id: 'n1',
            Name: 'my-net',
            Labels: {},
            Containers: { c1: {} },
        });

        const res = await app.request('/api/networks/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ networkIds: ['n1'], force: false }),
        });
        const json = await res.json();

        expect(json.skipped[0].reason).toBe('has_containers');
    });

    it('force-deletes networks with containers when force=true', async () => {
        mockNetwork.inspect.mockResolvedValue({
            Id: 'n1',
            Name: 'my-net',
            Labels: {},
            Containers: { c1: {} },
        });
        mockNetwork.disconnect.mockResolvedValue(undefined);
        mockNetwork.remove.mockResolvedValue(undefined);

        const res = await app.request('/api/networks/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ networkIds: ['n1'], force: true }),
        });
        const json = await res.json();

        expect(json.deleted).toContain('n1');
        expect(mockNetwork.disconnect).toHaveBeenCalledWith({ Container: 'c1', Force: true });
    });

    it('returns 400 when networkIds is empty', async () => {
        const res = await app.request('/api/networks/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ networkIds: [] }),
        });

        expect(res.status).toBe(400);
    });
});
