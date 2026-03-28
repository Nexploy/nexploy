import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import composeRoutes from '@/routes/composeRoutes';

const app = new Hono();
app.route('/api/composes', composeRoutes);

const COMPOSE_CONTAINERS = [
    {
        Id: 'c1',
        Names: ['/myproject_web_1'],
        Image: 'nginx:latest',
        State: 'running',
        Status: 'Up 2 hours',
        Labels: { 'com.docker.compose.project': 'myproject' },
    },
    {
        Id: 'c2',
        Names: ['/myproject_db_1'],
        Image: 'postgres:15',
        State: 'running',
        Status: 'Up 2 hours',
        Labels: { 'com.docker.compose.project': 'myproject' },
    },
];

const mockContainer = {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    unpause: vi.fn(),
    restart: vi.fn(),
    remove: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        listContainers: vi.fn(),
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

describe('GET /api/composes/:project/list', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns containers filtered by compose project label', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue(COMPOSE_CONTAINERS as any);

        const res = await app.request('/api/composes/myproject/list');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual(COMPOSE_CONTAINERS);
        expect(docker.listContainers).toHaveBeenCalledWith({
            filters: { label: ['com.docker.compose.project=myproject'] },
        });
    });
});

describe('POST /api/composes/:project/start', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('starts all containers in the compose project', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue(COMPOSE_CONTAINERS as any);
        mockContainer.start.mockResolvedValue(undefined);

        const res = await app.request('/api/composes/myproject/start', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toHaveLength(2);
        expect(mockContainer.start).toHaveBeenCalledTimes(2);
    });

    it('ignores "already running" errors', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue([COMPOSE_CONTAINERS[0]] as any);
        mockContainer.start.mockRejectedValueOnce(new Error('already started'));

        const res = await app.request('/api/composes/myproject/start', { method: 'POST' });
        expect(res.status).toBe(200);
    });
});

describe('POST /api/composes/:project/stop', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('stops all containers in the compose project', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue(COMPOSE_CONTAINERS as any);
        mockContainer.stop.mockResolvedValue(undefined);

        const res = await app.request('/api/composes/myproject/stop', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toHaveLength(2);
        expect(mockContainer.stop).toHaveBeenCalledTimes(2);
    });
});

describe('POST /api/composes/:project/pause', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('pauses all containers in the compose project', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue([COMPOSE_CONTAINERS[0]] as any);
        mockContainer.pause.mockResolvedValue(undefined);

        const res = await app.request('/api/composes/myproject/pause', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(mockContainer.pause).toHaveBeenCalledOnce();
    });
});

describe('POST /api/composes/:project/unpause', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('unpauses all containers', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue([COMPOSE_CONTAINERS[0]] as any);
        mockContainer.unpause.mockResolvedValue(undefined);

        const res = await app.request('/api/composes/myproject/unpause', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(mockContainer.unpause).toHaveBeenCalledOnce();
    });
});

describe('POST /api/composes/:project/restart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('restarts all containers', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue(COMPOSE_CONTAINERS as any);
        mockContainer.restart.mockResolvedValue(undefined);

        const res = await app.request('/api/composes/myproject/restart', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(mockContainer.restart).toHaveBeenCalledTimes(2);
    });
});

describe('POST /api/composes/:project/remove', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('stops running containers and removes them all', async () => {
        vi.mocked(docker.listContainers).mockResolvedValue(COMPOSE_CONTAINERS as any);
        mockContainer.stop.mockResolvedValue(undefined);
        mockContainer.remove.mockResolvedValue(undefined);

        const res = await app.request('/api/composes/myproject/remove', { method: 'POST' });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toHaveLength(2);
        expect(mockContainer.stop).toHaveBeenCalledTimes(2);
        expect(mockContainer.remove).toHaveBeenCalledTimes(2);
    });
});
