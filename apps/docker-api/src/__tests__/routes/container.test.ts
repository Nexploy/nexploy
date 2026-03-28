import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import containerRoutes from '@/routes/containerRoutes';

const app = new Hono();
app.route('/api/container', containerRoutes);

const mockContainer = {
    id: 'abc123',
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    unpause: vi.fn().mockResolvedValue(undefined),
    restart: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    inspect: vi.fn(),
};

const mockNewContainer = {
    id: 'newid123',
    start: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        createContainer: vi.fn(),
        getContainer: vi.fn(),
    },
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe('POST /api/container/create', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.createContainer).mockResolvedValue(mockContainer as any);
    });

    it('creates and starts a container, returns id', async () => {
        const body = {
            name: 'my-app',
            image: 'nginx:latest',
            hostname: 'my-app',
            restart: 'unless-stopped',
            autoRemove: false,
            privileged: false,
            ports: [],
            envVars: [],
            volumes: [],
        };

        const res = await app.request('/api/container/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ id: 'abc123' });
        expect(docker.createContainer).toHaveBeenCalledOnce();
        expect(mockContainer.start).toHaveBeenCalledOnce();
    });

    it('maps ports, envVars, and volumes to createOptions', async () => {
        const body = {
            name: 'my-app',
            image: 'nginx:latest',
            hostname: 'my-app',
            restart: 'no',
            autoRemove: false,
            privileged: false,
            network: 'bridge',
            ports: [{ containerPort: '80', hostPort: '8080', protocol: 'tcp' }],
            envVars: [{ key: 'NODE_ENV', value: 'production' }],
            volumes: [{ hostPath: '/data', containerPath: '/app/data', readOnly: false }],
        };

        const res = await app.request('/api/container/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        expect(res.status).toBe(200);
        const callArg = vi.mocked(docker.createContainer).mock.calls[0][0] as any;
        expect(callArg.ExposedPorts).toEqual({ '80/tcp': {} });
        expect(callArg.HostConfig.PortBindings).toEqual({ '80/tcp': [{ HostPort: '8080' }] });
        expect(callArg.Env).toEqual(['NODE_ENV=production']);
        expect(callArg.HostConfig.Binds).toEqual(['/data:/app/data:rw']);
        expect(callArg.HostConfig.NetworkMode).toBe('bridge');
    });

    it('does not throw if container.start() fails', async () => {
        mockContainer.start.mockRejectedValueOnce(new Error('start failed'));

        const body = {
            name: 'my-app',
            image: 'nginx:latest',
            hostname: '',
            restart: 'no',
            autoRemove: false,
            privileged: false,
            ports: [],
            envVars: [],
            volumes: [],
        };

        const res = await app.request('/api/container/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ id: 'abc123' });
    });
});

describe('POST /api/container/:id/start', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('starts the container and returns docker response', async () => {
        mockContainer.start.mockResolvedValue({ ok: true });
        const res = await app.request('/api/container/abc123/start', { method: 'POST' });
        expect(res.status).toBe(200);
        expect(docker.getContainer).toHaveBeenCalledWith('abc123');
        expect(mockContainer.start).toHaveBeenCalledOnce();
    });

    it('returns 500 if start throws', async () => {
        mockContainer.start.mockRejectedValueOnce(new Error('already running'));
        const res = await app.request('/api/container/abc123/start', { method: 'POST' });
        expect(res.status).toBe(500);
    });
});

describe('POST /api/container/:id/stop', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('stops the container', async () => {
        mockContainer.stop.mockResolvedValue(undefined);
        const res = await app.request('/api/container/abc123/stop', { method: 'POST' });
        expect(res.status).toBe(200);
        expect(mockContainer.stop).toHaveBeenCalledOnce();
    });
});

describe('POST /api/container/:id/pause', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('pauses the container and returns ok', async () => {
        mockContainer.pause.mockResolvedValue(undefined);
        const res = await app.request('/api/container/abc123/pause', { method: 'POST' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ ok: true });
    });
});

describe('POST /api/container/:id/unpause', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('unpauses the container and returns ok', async () => {
        mockContainer.unpause.mockResolvedValue(undefined);
        const res = await app.request('/api/container/abc123/unpause', { method: 'POST' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ ok: true });
    });
});

describe('POST /api/container/:id/restart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('restarts the container and returns ok', async () => {
        mockContainer.restart.mockResolvedValue(undefined);
        const res = await app.request('/api/container/abc123/restart', { method: 'POST' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ ok: true });
    });
});

describe('GET /api/container/:id/info', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('returns container inspect data', async () => {
        const inspectData = { Id: 'abc123', State: { Running: true } };
        mockContainer.inspect.mockResolvedValue(inspectData);

        const res = await app.request('/api/container/abc123/info');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(inspectData);
    });

    it('returns 404 when container not found (statusCode 404)', async () => {
        mockContainer.inspect.mockRejectedValueOnce(
            Object.assign(new Error('No such container'), { statusCode: 404 }),
        );

        const res = await app.request('/api/container/notexist/info');
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.message).toBeDefined();
    });

    it('re-throws non-404 errors as 500', async () => {
        mockContainer.inspect.mockRejectedValueOnce(new Error('Docker daemon error'));

        const res = await app.request('/api/container/abc123/info');
        expect(res.status).toBe(500);
    });
});

describe('DELETE /api/container/:id/remove', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('stops and removes a running container', async () => {
        mockContainer.inspect.mockResolvedValue({ State: { Running: true } });
        mockContainer.stop.mockResolvedValue(undefined);
        mockContainer.remove.mockResolvedValue(undefined);

        const res = await app.request('/api/container/abc123/remove', { method: 'DELETE' });
        expect(res.status).toBe(200);
        expect(mockContainer.stop).toHaveBeenCalledOnce();
        expect(mockContainer.remove).toHaveBeenCalledOnce();
    });

    it('removes a stopped container without stopping', async () => {
        mockContainer.inspect.mockResolvedValue({ State: { Running: false } });
        mockContainer.remove.mockResolvedValue(undefined);

        const res = await app.request('/api/container/abc123/remove', { method: 'DELETE' });
        expect(res.status).toBe(200);
        expect(mockContainer.stop).not.toHaveBeenCalled();
        expect(mockContainer.remove).toHaveBeenCalledOnce();
    });
});

describe('POST /api/container/recreate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
        vi.mocked(docker.createContainer).mockResolvedValue(mockNewContainer as any);
    });

    it('recreates a running container and returns new id', async () => {
        mockContainer.inspect.mockResolvedValue({
            Name: '/my-app',
            State: { Running: true },
            Config: {
                Image: 'nginx:latest',
                Hostname: 'my-app',
                Env: ['KEY=value'],
                Cmd: null,
                Entrypoint: null,
                Volumes: {},
                WorkingDir: '',
                User: '',
                Labels: {},
                ExposedPorts: {},
            },
            HostConfig: { PortBindings: {}, Binds: [] },
            NetworkSettings: { Networks: { bridge: {} } },
        });
        mockContainer.stop.mockResolvedValue(undefined);
        mockContainer.remove.mockResolvedValue(undefined);

        const body = {
            containerId: 'abc123',
            ports: [],
            envVars: [],
            volumes: [],
            networks: [],
        };

        const res = await app.request('/api/container/recreate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ id: 'newid123' });
        expect(mockContainer.stop).toHaveBeenCalledOnce();
        expect(mockContainer.remove).toHaveBeenCalledOnce();
        expect(docker.createContainer).toHaveBeenCalledOnce();
        expect(mockNewContainer.start).toHaveBeenCalledOnce();
    });

    it('does not stop a stopped container before recreating', async () => {
        mockContainer.inspect.mockResolvedValue({
            Name: '/my-app',
            State: { Running: false },
            Config: {
                Image: 'nginx:latest',
                Hostname: '',
                Env: [],
                Cmd: null,
                Entrypoint: null,
                Volumes: {},
                WorkingDir: '',
                User: '',
                Labels: {},
                ExposedPorts: {},
            },
            HostConfig: { PortBindings: {}, Binds: [] },
            NetworkSettings: { Networks: {} },
        });
        mockContainer.remove.mockResolvedValue(undefined);

        const body = {
            containerId: 'abc123',
            ports: [],
            envVars: [],
            volumes: [],
            networks: [],
        };

        const res = await app.request('/api/container/recreate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        expect(res.status).toBe(200);
        expect(mockContainer.stop).not.toHaveBeenCalled();
    });
});
