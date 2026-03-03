import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { traefikLogsManager } from '@/managers/traefikLogsManager';
import traefikRoutes from '@/routes/traefikRoutes';

const app = new Hono();
app.route('/api/traefik', traefikRoutes);

vi.mock('@/managers/traefikLogsManager', () => ({
    traefikLogsManager: {
        getRequests: vi.fn(),
        clearRequests: vi.fn(),
    },
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe('GET /api/traefik/requests', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all traefik request logs', async () => {
        const requests = [
            { method: 'GET', path: '/api/hello', status: 200, duration: 15 },
            { method: 'POST', path: '/api/data', status: 201, duration: 42 },
        ];
        vi.mocked(traefikLogsManager.getRequests).mockReturnValue(requests as any);

        const res = await app.request('/api/traefik/requests');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(requests);
        expect(traefikLogsManager.getRequests).toHaveBeenCalledOnce();
    });

    it('returns empty array when no requests logged', async () => {
        vi.mocked(traefikLogsManager.getRequests).mockReturnValue([]);

        const res = await app.request('/api/traefik/requests');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual([]);
    });
});

describe('DELETE /api/traefik/requests', () => {
    beforeEach(() => vi.clearAllMocks());

    it('clears request logs and returns success', async () => {
        vi.mocked(traefikLogsManager.clearRequests).mockReturnValue(undefined as any);

        const res = await app.request('/api/traefik/requests', { method: 'DELETE' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ success: true });
        expect(traefikLogsManager.clearRequests).toHaveBeenCalledOnce();
    });
});
