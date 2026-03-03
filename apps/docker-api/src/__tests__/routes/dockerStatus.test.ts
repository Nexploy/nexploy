import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { containersStateManager } from '@/managers/containersStateManager';
import { imagesStateManager } from '@/managers/imagesStateManager';
import dockerStatusRoutes from '@/routes/dockerStatusRoutes';

const app = new Hono();
app.route('/api/docker', dockerStatusRoutes);

vi.mock('@/managers/dockerStatusManager', () => ({
    dockerStatusManager: {
        getStatus: vi.fn(),
        getLastCheck: vi.fn(),
        isConnected: vi.fn(),
        isDisconnected: vi.fn(),
        getStats: vi.fn(),
    },
}));

vi.mock('@/managers/containersStateManager', () => ({
    containersStateManager: {
        getStats: vi.fn(),
    },
}));

vi.mock('@/managers/imagesStateManager', () => ({
    imagesStateManager: {
        getStats: vi.fn(),
    },
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe('GET /api/docker/status', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns docker connection status with all fields', async () => {
        const lastCheck = '2026-01-01T00:00:00Z';
        vi.mocked(dockerStatusManager.getStatus).mockReturnValue('connected' as any);
        vi.mocked(dockerStatusManager.getLastCheck).mockReturnValue(lastCheck as any);
        vi.mocked(dockerStatusManager.isConnected).mockReturnValue(true);
        vi.mocked(dockerStatusManager.isDisconnected).mockReturnValue(false);

        const res = await app.request('/api/docker/status');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.status).toBe('connected');
        expect(json.isConnected).toBe(true);
        expect(json.isDisconnected).toBe(false);
        expect(json.lastCheck).toBe(lastCheck);
        expect(json.timestamp).toBeTypeOf('number');
    });

    it('returns disconnected status', async () => {
        vi.mocked(dockerStatusManager.getStatus).mockReturnValue('disconnected' as any);
        vi.mocked(dockerStatusManager.getLastCheck).mockReturnValue(null as any);
        vi.mocked(dockerStatusManager.isConnected).mockReturnValue(false);
        vi.mocked(dockerStatusManager.isDisconnected).mockReturnValue(true);

        const res = await app.request('/api/docker/status');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.isConnected).toBe(false);
        expect(json.isDisconnected).toBe(true);
    });
});

describe('GET /api/docker/stats', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns combined docker, containers, and images stats', async () => {
        vi.mocked(dockerStatusManager.getStats).mockReturnValue({ version: '24.0' } as any);
        vi.mocked(containersStateManager.getStats).mockReturnValue({ total: 5, running: 3 } as any);
        vi.mocked(imagesStateManager.getStats).mockReturnValue({ total: 10 } as any);

        const res = await app.request('/api/docker/stats');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.docker).toEqual({ version: '24.0' });
        expect(json.containers).toEqual({ total: 5, running: 3 });
        expect(json.images).toEqual({ total: 10 });
        expect(json.timestamp).toBeTypeOf('number');
    });
});
