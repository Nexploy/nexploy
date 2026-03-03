import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { swarmStateManager } from '@/managers/swarmStateManager';
import serviceRoutes from '@/routes/swarm/serviceRoutes';

const app = new Hono();
app.route('/api/swarm/services', serviceRoutes);

const SERVICE_INSPECT = {
    Id: 'svc1',
    Version: { Index: 5 },
    Spec: {
        Name: 'my-service',
        TaskTemplate: {
            ContainerSpec: { Image: 'nginx:latest', Env: [] },
            ForceUpdate: 0,
        },
        Mode: { Replicated: { Replicas: 2 } },
        Labels: { app: 'web' },
    },
    PreviousSpec: {
        Name: 'my-service',
        TaskTemplate: { ContainerSpec: { Image: 'nginx:1.0' }, ForceUpdate: 0 },
        Mode: { Replicated: { Replicas: 1 } },
    },
};

const mockService = {
    inspect: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    logs: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        getService: vi.fn(),
        createService: vi.fn(),
    },
}));

vi.mock('@/managers/swarmStateManager', () => ({
    swarmStateManager: {
        getAllServices: vi.fn(),
        getService: vi.fn(),
        getTasksByService: vi.fn(),
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

describe('GET /api/swarm/services/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all services', async () => {
        vi.mocked(swarmStateManager.getAllServices).mockReturnValue([{ ID: 'svc1' }] as any);

        const res = await app.request('/api/swarm/services');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.services).toHaveLength(1);
    });
});

describe('GET /api/swarm/services/:id', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns service with its tasks', async () => {
        vi.mocked(swarmStateManager.getService).mockReturnValue({ ID: 'svc1' } as any);
        vi.mocked(swarmStateManager.getTasksByService).mockReturnValue([{ ID: 't1' }] as any);

        const res = await app.request('/api/swarm/services/svc1');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.service).toEqual({ ID: 'svc1' });
        expect(json.tasks).toHaveLength(1);
    });

    it('returns 404 when service not found', async () => {
        vi.mocked(swarmStateManager.getService).mockReturnValue(null as any);

        const res = await app.request('/api/swarm/services/notexist');
        expect(res.status).toBe(404);
    });
});

describe('POST /api/swarm/services/', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.createService).mockResolvedValue({ id: 'svc1' } as any);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getService).mockReturnValue({ ID: 'svc1' } as any);
    });

    it('creates a replicated service', async () => {
        const res = await app.request('/api/swarm/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'my-service', image: 'nginx:latest' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.serviceId).toBe('svc1');
        expect(docker.createService).toHaveBeenCalledOnce();
    });

    it('creates a global service', async () => {
        await app.request('/api/swarm/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'my-service', image: 'nginx:latest', mode: 'global' }),
        });

        const callArg = vi.mocked(docker.createService).mock.calls[0][0] as any;
        expect(callArg.Mode).toEqual({ Global: {} });
    });

    it('returns 400 when name or image is missing', async () => {
        const res = await app.request('/api/swarm/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'my-service' }), // missing image
        });

        expect(res.status).toBe(400);
    });

    it('maps ports to Docker format', async () => {
        await app.request('/api/swarm/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'my-service',
                image: 'nginx:latest',
                ports: [{ targetPort: 80, publishedPort: 8080, protocol: 'tcp' }],
            }),
        });

        const callArg = vi.mocked(docker.createService).mock.calls[0][0] as any;
        expect(callArg.EndpointSpec.Ports[0]).toEqual({
            Protocol: 'tcp',
            TargetPort: 80,
            PublishedPort: 8080,
            PublishMode: 'ingress',
        });
    });
});

describe('PATCH /api/swarm/services/:id', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getService).mockReturnValue(mockService as any);
        mockService.inspect.mockResolvedValue(SERVICE_INSPECT);
        mockService.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getService).mockReturnValue({ ID: 'svc1' } as any);
    });

    it('updates service image', async () => {
        const res = await app.request('/api/swarm/services/svc1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: 'nginx:1.25' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        const updateArg = mockService.update.mock.calls[0][0] as any;
        expect(updateArg.TaskTemplate.ContainerSpec.Image).toBe('nginx:1.25');
    });

    it('updates replica count', async () => {
        await app.request('/api/swarm/services/svc1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ replicas: 5 }),
        });

        const updateArg = mockService.update.mock.calls[0][0] as any;
        expect(updateArg.Mode.Replicated.Replicas).toBe(5);
    });
});

describe('DELETE /api/swarm/services/:id', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getService).mockReturnValue(mockService as any);
        mockService.remove.mockResolvedValue(undefined);
    });

    it('removes a service', async () => {
        const res = await app.request('/api/swarm/services/svc1', { method: 'DELETE' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.serviceId).toBe('svc1');
        expect(mockService.remove).toHaveBeenCalledOnce();
    });
});

describe('POST /api/swarm/services/:id/scale', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getService).mockReturnValue(mockService as any);
        mockService.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getService).mockReturnValue({ ID: 'svc1' } as any);
    });

    it('scales a replicated service', async () => {
        mockService.inspect.mockResolvedValue(SERVICE_INSPECT);

        const res = await app.request('/api/swarm/services/svc1/scale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ replicas: 5 }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockService.update).toHaveBeenCalledWith(
            expect.objectContaining({ Mode: { Replicated: { Replicas: 5 } } }),
        );
    });

    it('returns 400 for invalid replica count', async () => {
        const res = await app.request('/api/swarm/services/svc1/scale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ replicas: -1 }),
        });

        expect(res.status).toBe(400);
    });

    it('returns 400 for global service (no Replicated mode)', async () => {
        mockService.inspect.mockResolvedValue({
            ...SERVICE_INSPECT,
            Spec: { ...SERVICE_INSPECT.Spec, Mode: { Global: {} } },
        });

        const res = await app.request('/api/swarm/services/svc1/scale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ replicas: 3 }),
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/swarm/services/:id/rollback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getService).mockReturnValue(mockService as any);
        mockService.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getService).mockReturnValue({ ID: 'svc1' } as any);
    });

    it('rolls back to previous spec', async () => {
        mockService.inspect.mockResolvedValue(SERVICE_INSPECT);

        const res = await app.request('/api/swarm/services/svc1/rollback', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockService.update).toHaveBeenCalledWith(
            expect.objectContaining({ version: 5, ...SERVICE_INSPECT.PreviousSpec }),
        );
    });

    it('returns 400 when no previous spec exists', async () => {
        mockService.inspect.mockResolvedValue({ ...SERVICE_INSPECT, PreviousSpec: undefined });

        const res = await app.request('/api/swarm/services/svc1/rollback', { method: 'POST' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/swarm/services/:id/force-update', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getService).mockReturnValue(mockService as any);
        mockService.inspect.mockResolvedValue(SERVICE_INSPECT);
        mockService.update.mockResolvedValue(undefined);
        vi.mocked(swarmStateManager.hardRefresh).mockResolvedValue(undefined as any);
        vi.mocked(swarmStateManager.getService).mockReturnValue({ ID: 'svc1' } as any);
    });

    it('increments ForceUpdate to trigger redeployment', async () => {
        const res = await app.request('/api/swarm/services/svc1/force-update', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        const updateArg = mockService.update.mock.calls[0][0] as any;
        // ForceUpdate was 0, should be incremented to 1
        expect(updateArg.TaskTemplate.ForceUpdate).toBe(1);
    });
});

describe('GET /api/swarm/services/:id/logs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getService).mockReturnValue(mockService as any);
    });

    it('returns service logs as string', async () => {
        mockService.logs.mockResolvedValue(Buffer.from('log line 1\nlog line 2\n'));

        const res = await app.request('/api/swarm/services/svc1/logs');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.logs).toBe('log line 1\nlog line 2\n');
        expect(mockService.logs).toHaveBeenCalledWith({
            stdout: true,
            stderr: true,
            tail: 100,
            timestamps: false,
        });
    });

    it('respects tail and timestamps query params', async () => {
        mockService.logs.mockResolvedValue(Buffer.from(''));

        await app.request('/api/swarm/services/svc1/logs?tail=50&timestamps=true');

        expect(mockService.logs).toHaveBeenCalledWith({
            stdout: true,
            stderr: true,
            tail: 50,
            timestamps: true,
        });
    });
});
