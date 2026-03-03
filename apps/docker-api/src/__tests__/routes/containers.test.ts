import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { filterNexployContainers } from '@workspace/shared/nexployFilter';
import containersRoutes from '@/routes/containersRoutes';

const app = new Hono();
app.route('/api/containers', containersRoutes);

const CONTAINER_A = { id: 'c1', name: '/web', state: 'running' };
const CONTAINER_B = { id: 'c2', name: '/api', state: 'stopped' };

vi.mock('@/managers/containersStateManager', () => ({
    containersStateManager: {
        getAllStates: vi.fn(),
        hardRefresh: vi.fn(),
    },
}));

vi.mock('@workspace/shared/nexployFilter', () => ({
    filterNexployContainers: vi.fn((containers: any[]) => containers),
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe('GET /api/containers/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all nexploy containers when no name query', async () => {
        vi.mocked(containersStateManager.getAllStates).mockReturnValue([
            CONTAINER_A,
            CONTAINER_B,
        ] as any);
        vi.mocked(filterNexployContainers).mockReturnValue([CONTAINER_A, CONTAINER_B] as any);

        const res = await app.request('/api/containers');
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([CONTAINER_A, CONTAINER_B]);
        expect(containersStateManager.getAllStates).toHaveBeenCalledOnce();
        expect(filterNexployContainers).toHaveBeenCalledWith([CONTAINER_A, CONTAINER_B]);
    });

    it('filters by name when ?name= query is provided (exact match)', async () => {
        vi.mocked(containersStateManager.getAllStates).mockReturnValue([
            CONTAINER_A,
            CONTAINER_B,
        ] as any);
        vi.mocked(filterNexployContainers).mockReturnValue([CONTAINER_A, CONTAINER_B] as any);

        const res = await app.request('/api/containers?name=web');
        const body = await res.json();

        expect(res.status).toBe(200);
        // name is '/web', query 'web' → matches via `/${name}` check
        expect(body).toEqual([CONTAINER_A]);
    });

    it('filters by name with leading slash (exact match)', async () => {
        vi.mocked(containersStateManager.getAllStates).mockReturnValue([
            CONTAINER_A,
            CONTAINER_B,
        ] as any);
        vi.mocked(filterNexployContainers).mockReturnValue([CONTAINER_A, CONTAINER_B] as any);

        const res = await app.request('/api/containers?name=/api');
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([CONTAINER_B]);
    });

    it('returns empty array when name does not match', async () => {
        vi.mocked(containersStateManager.getAllStates).mockReturnValue([CONTAINER_A] as any);
        vi.mocked(filterNexployContainers).mockReturnValue([CONTAINER_A] as any);

        const res = await app.request('/api/containers?name=notexisting');
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([]);
    });
});

describe('POST /api/containers/hardRefresh', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls hardRefresh and returns result', async () => {
        vi.mocked(containersStateManager.hardRefresh).mockResolvedValue([CONTAINER_A] as any);

        const res = await app.request('/api/containers/hardRefresh', { method: 'POST' });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([CONTAINER_A]);
        expect(containersStateManager.hardRefresh).toHaveBeenCalledOnce();
    });

    it('returns 500 if hardRefresh throws', async () => {
        vi.mocked(containersStateManager.hardRefresh).mockRejectedValue(new Error('Docker error'));

        const res = await app.request('/api/containers/hardRefresh', { method: 'POST' });

        expect(res.status).toBe(500);
    });
});
