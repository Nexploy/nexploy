import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createDockerClient } from '@/utils/dockerClient';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import environmentsRoutes from '@/routes/environments.routes';

const app = new Hono();
app.route('/api/environments', environmentsRoutes);

const ENV_CONFIG = {
    id: 'env-1',
    name: 'Production',
    host: 'tcp://192.168.1.10:2376',
};

const mockTempClient = { ping: vi.fn() };

vi.mock('@/utils/dockerClient', () => ({
    createDockerClient: vi.fn(),
}));

vi.mock('@/lib/dockerClientRegistry', () => ({
    dockerClientRegistry: {
        registerEnvironment: vi.fn(),
        unregisterEnvironment: vi.fn(),
        reloadEnvironment: vi.fn(),
    },
}));

vi.mock('@/managers/factory/StateManagerFactory', () => ({
    stateManagerFactory: {
        initializeEnvironment: vi.fn(),
        shutdownEnvironment: vi.fn(),
    },
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('@hono/zod-validator', () => ({
    zValidator: (target: string, _schema: any) => async (c: any, next: any) => {
        if (target === 'json') {
            const body = await c.req.json();
            c.req.addValidatedData(target, body);
        } else if (target === 'param') {
            c.req.addValidatedData(target, c.req.param());
        }
        await next();
    },
}));

describe('POST /api/environments/validate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createDockerClient).mockReturnValue(mockTempClient as any);
    });

    it('returns valid=true when docker host is reachable', async () => {
        mockTempClient.ping.mockResolvedValue(undefined);

        const res = await app.request('/api/environments/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ENV_CONFIG),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.valid).toBe(true);
        expect(mockTempClient.ping).toHaveBeenCalledOnce();
    });

    it('returns 400 when docker host is unreachable', async () => {
        mockTempClient.ping.mockRejectedValueOnce(new Error('Connection refused'));

        const res = await app.request('/api/environments/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ENV_CONFIG),
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/environments/register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createDockerClient).mockReturnValue(mockTempClient as any);
    });

    it('registers environment and initializes state managers', async () => {
        vi.mocked(dockerClientRegistry.registerEnvironment).mockResolvedValue(undefined as any);
        vi.mocked(stateManagerFactory.initializeEnvironment).mockResolvedValue(undefined as any);

        const res = await app.request('/api/environments/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ENV_CONFIG),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.environmentId).toBe('env-1');
        expect(dockerClientRegistry.registerEnvironment).toHaveBeenCalledWith(ENV_CONFIG);
        expect(stateManagerFactory.initializeEnvironment).toHaveBeenCalledWith('env-1');
    });

    it('cleans up and re-throws if registration fails', async () => {
        vi.mocked(dockerClientRegistry.registerEnvironment).mockRejectedValueOnce(
            new Error('Already registered'),
        );
        vi.mocked(dockerClientRegistry.unregisterEnvironment).mockResolvedValue(undefined as any);

        const res = await app.request('/api/environments/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ENV_CONFIG),
        });

        expect(res.status).toBe(500);
        expect(dockerClientRegistry.unregisterEnvironment).toHaveBeenCalledWith('env-1');
    });
});

describe('DELETE /api/environments/:environmentId', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(stateManagerFactory.shutdownEnvironment).mockResolvedValue(undefined as any);
        vi.mocked(dockerClientRegistry.unregisterEnvironment).mockResolvedValue(undefined as any);
    });

    it('shuts down managers and unregisters environment', async () => {
        const res = await app.request('/api/environments/env-1', { method: 'DELETE' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(stateManagerFactory.shutdownEnvironment).toHaveBeenCalledWith('env-1');
        expect(dockerClientRegistry.unregisterEnvironment).toHaveBeenCalledWith('env-1');
    });
});

describe('PATCH /api/environments/:environmentId', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createDockerClient).mockReturnValue(mockTempClient as any);
        mockTempClient.ping.mockResolvedValue(undefined);
        vi.mocked(stateManagerFactory.shutdownEnvironment).mockResolvedValue(undefined as any);
        vi.mocked(dockerClientRegistry.reloadEnvironment).mockResolvedValue(undefined as any);
        vi.mocked(stateManagerFactory.initializeEnvironment).mockResolvedValue(undefined as any);
    });

    it('validates, reloads, and re-initializes the environment', async () => {
        const res = await app.request('/api/environments/env-1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ENV_CONFIG),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.environmentId).toBe('env-1');
        expect(stateManagerFactory.shutdownEnvironment).toHaveBeenCalledWith('env-1');
        expect(dockerClientRegistry.reloadEnvironment).toHaveBeenCalledWith(ENV_CONFIG);
        expect(stateManagerFactory.initializeEnvironment).toHaveBeenCalledWith('env-1');
    });

    it('returns 400 if environmentId in param does not match config.id', async () => {
        const mismatchConfig = { ...ENV_CONFIG, id: 'env-9999' };

        const res = await app.request('/api/environments/env-1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mismatchConfig),
        });

        expect(res.status).toBe(400);
    });

    it('returns 400 when docker host is unreachable', async () => {
        mockTempClient.ping.mockRejectedValueOnce(new Error('Connection refused'));

        const res = await app.request('/api/environments/env-1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ENV_CONFIG),
        });

        expect(res.status).toBe(400);
    });
});
