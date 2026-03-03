import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { imagesStateManager } from '@/managers/imagesStateManager';
import imagesRoutes from '@/routes/imagesRoutes';

const app = new Hono();
app.route('/api/images', imagesRoutes);

const mockImage = {
    history: vi.fn(),
    tag: vi.fn(),
    remove: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        getImage: vi.fn(),
        pull: vi.fn(),
        modem: { followProgress: vi.fn() },
    },
}));

vi.mock('@/managers/imagesStateManager', () => ({
    imagesStateManager: {
        getAllImages: vi.fn(),
        getByName: vi.fn(),
        getById: vi.fn(),
        checkIfExistByName: vi.fn(),
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

describe('GET /api/images/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all images from state manager', async () => {
        const images = [{ id: 'sha256:abc', tags: ['nginx:latest'] }];
        vi.mocked(imagesStateManager.getAllImages).mockReturnValue(images as any);

        const res = await app.request('/api/images');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(images);
    });
});

describe('GET /api/images/name/:name', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns image by name', async () => {
        const image = { id: 'sha256:abc', tags: ['nginx:latest'] };
        vi.mocked(imagesStateManager.getByName).mockReturnValue(image as any);

        const res = await app.request('/api/images/name/nginx:latest');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(image);
        expect(imagesStateManager.getByName).toHaveBeenCalledWith('nginx:latest');
    });

    it('returns { ok: true } when image not found by name (null → handleAsync fallback)', async () => {
        vi.mocked(imagesStateManager.getByName).mockReturnValue(null as any);

        const res = await app.request('/api/images/name/unknown:latest');
        const json = await res.json();

        // handleAsync: c.json(result ?? { ok: true }) — null triggers the fallback
        expect(res.status).toBe(200);
        expect(json).toEqual({ ok: true });
    });
});

describe('GET /api/images/id/:id', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns image by id', async () => {
        const image = { id: 'sha256:abc' };
        vi.mocked(imagesStateManager.getById).mockReturnValue(image as any);

        const res = await app.request('/api/images/id/sha256:abc');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(image);
        expect(imagesStateManager.getById).toHaveBeenCalledWith('sha256:abc');
    });
});

describe('POST /api/images/hardRefresh', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls hardRefresh and returns result', async () => {
        vi.mocked(imagesStateManager.hardRefresh).mockResolvedValue([{ id: 'sha256:abc' }] as any);

        const res = await app.request('/api/images/hardRefresh', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual([{ id: 'sha256:abc' }]);
    });
});

describe('POST /api/images/pull', () => {
    beforeEach(() => vi.clearAllMocks());

    it('pulls an image that does not exist yet', async () => {
        vi.mocked(imagesStateManager.checkIfExistByName).mockReturnValue(false);
        vi.mocked(docker.pull).mockImplementation(((_name: string, cb: any) => {
            const stream = {};
            cb(null, stream);
        }) as any);
        vi.mocked(docker.modem.followProgress).mockImplementation(
            (_stream: any, cb: (e: null, o: any[]) => void) => cb(null, []),
        );

        const res = await app.request('/api/images/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageName: 'nginx:latest' }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ imageName: 'nginx:latest' });
    });

    it('throws if image already exists', async () => {
        vi.mocked(imagesStateManager.checkIfExistByName).mockReturnValue(true);

        const res = await app.request('/api/images/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageName: 'nginx:latest' }),
        });

        expect(res.status).toBe(500);
    });

    it('returns 500 if docker.pull callback returns error', async () => {
        vi.mocked(imagesStateManager.checkIfExistByName).mockReturnValue(false);
        vi.mocked(docker.pull).mockImplementation(((_name: string, cb: any) => {
            return cb(new Error('pull error'), null);
        }) as any);

        const res = await app.request('/api/images/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageName: 'nginx:latest' }),
        });

        expect(res.status).toBe(500);
    });
});

describe('GET /api/images/:id/history', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getImage).mockReturnValue(mockImage as any);
    });

    it('returns image history', async () => {
        const history = [{ Id: '<missing>', Created: 1234567890 }];
        mockImage.history.mockResolvedValue(history);

        const res = await app.request('/api/images/sha256:abc/history');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(history);
        expect(docker.getImage).toHaveBeenCalledWith('sha256:abc');
    });
});

describe('POST /api/images/delete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getImage).mockReturnValue(mockImage as any);
    });

    it('deletes multiple images and returns deleted ids', async () => {
        mockImage.remove.mockResolvedValue(undefined);

        const res = await app.request('/api/images/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageIds: ['sha256:a1', 'sha256:a2'], force: false }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ deleted: ['sha256:a1', 'sha256:a2'] });
        expect(docker.getImage).toHaveBeenCalledTimes(2);
        expect(mockImage.remove).toHaveBeenCalledWith({ force: false });
    });

    it('returns 400 when imageIds is empty', async () => {
        const res = await app.request('/api/images/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageIds: [], force: false }),
        });

        expect(res.status).toBe(400);
    });

    it('returns 500 when remove throws', async () => {
        mockImage.remove.mockRejectedValueOnce(new Error('image is in use'));

        const res = await app.request('/api/images/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageIds: ['sha256:a1'], force: false }),
        });

        expect(res.status).toBe(500);
    });
});
