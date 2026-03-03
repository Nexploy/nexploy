import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

import { docker } from '@/utils/dockerClient';
import { volumesStateManager } from '@/managers/volumesStateManager';
import volumesRoutes from '@/routes/volumesRoutes';

const app = new Hono();
app.route('/api/volumes', volumesRoutes);

const mockVolume = {
    inspect: vi.fn(),
    remove: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        getVolume: vi.fn(),
        createVolume: vi.fn(),
        pruneVolumes: vi.fn(),
    },
}));

vi.mock('@/managers/volumesStateManager', () => ({
    volumesStateManager: {
        getAllVolumes: vi.fn(),
        getState: vi.fn(),
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

describe('GET /api/volumes/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all volumes', async () => {
        const volumes = [{ Name: 'vol1', Driver: 'local' }];
        vi.mocked(volumesStateManager.getAllVolumes).mockReturnValue(volumes as any);

        const res = await app.request('/api/volumes');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(volumes);
    });
});

describe('POST /api/volumes/hardRefresh', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls hardRefresh and returns result', async () => {
        vi.mocked(volumesStateManager.hardRefresh).mockResolvedValue([{ Name: 'vol1' }] as any);

        const res = await app.request('/api/volumes/hardRefresh', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual([{ Name: 'vol1' }]);
    });
});

describe('POST /api/volumes/create', () => {
    beforeEach(() => vi.clearAllMocks());

    it('creates a new volume and returns its name', async () => {
        vi.mocked(volumesStateManager.getState).mockReturnValue(null as any);
        vi.mocked(docker.createVolume).mockResolvedValue({ Name: 'my-vol' } as any);

        const res = await app.request('/api/volumes/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'my-vol', driver: 'local' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ volumeName: 'my-vol' });
        expect(docker.createVolume).toHaveBeenCalledWith({
            Name: 'my-vol',
            Driver: 'local',
            DriverOpts: undefined,
            Labels: undefined,
        });
    });

    it('throws if volume already exists', async () => {
        vi.mocked(volumesStateManager.getState).mockReturnValue({ Name: 'my-vol' } as any);

        const res = await app.request('/api/volumes/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'my-vol', driver: 'local' }),
        });

        expect(res.status).toBe(500);
    });
});

describe('GET /api/volumes/:name/inspect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getVolume).mockReturnValue(mockVolume as any);
    });

    it('returns volume inspection data', async () => {
        const data = { Name: 'vol1', Driver: 'local', Mountpoint: '/var/lib/docker/volumes/vol1' };
        mockVolume.inspect.mockResolvedValue(data);

        const res = await app.request('/api/volumes/vol1/inspect');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(data);
        expect(docker.getVolume).toHaveBeenCalledWith('vol1');
    });
});

describe('POST /api/volumes/delete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getVolume).mockReturnValue(mockVolume as any);
    });

    it('deletes multiple volumes and returns deleted names', async () => {
        mockVolume.remove.mockResolvedValue(undefined);

        const res = await app.request('/api/volumes/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volumeNames: ['vol1', 'vol2'] }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ deleted: ['vol1', 'vol2'] });
        expect(docker.getVolume).toHaveBeenCalledTimes(2);
    });

    it('respects force query param', async () => {
        mockVolume.remove.mockResolvedValue(undefined);

        await app.request('/api/volumes/delete?force=true', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volumeNames: ['vol1'] }),
        });

        expect(mockVolume.remove).toHaveBeenCalledWith({ force: true });
    });

    it('returns 400 when volumeNames is empty', async () => {
        const res = await app.request('/api/volumes/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volumeNames: [] }),
        });

        expect(res.status).toBe(400);
    });

    it('returns 400 when volumeNames is missing', async () => {
        const res = await app.request('/api/volumes/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/volumes/prune', () => {
    beforeEach(() => vi.clearAllMocks());

    it('prunes unused volumes and returns result', async () => {
        const pruneResult = { VolumesDeleted: ['old-vol'], SpaceReclaimed: 1024 };
        vi.mocked(docker.pruneVolumes).mockResolvedValue(pruneResult as any);

        const res = await app.request('/api/volumes/prune', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(pruneResult);
    });
});
