import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { swarmStateManager } from '@/managers/swarmStateManager';
import taskRoutes from '@/routes/swarm/taskRoutes';

const mockContainer = {
    logs: vi.fn(),
};

vi.mock('@/utils/dockerClient', () => ({
    docker: {
        getContainer: vi.fn(),
    },
}));

vi.mock('@/managers/swarmStateManager', () => ({
    swarmStateManager: {
        getAllTasks: vi.fn(),
        getTask: vi.fn(),
        getTasksByService: vi.fn(),
        getTasksByNode: vi.fn(),
    },
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const app = new Hono();
app.route('/api/swarm/tasks', taskRoutes);

const TASK_RUNNING = {
    ID: 'task1',
    serviceId: 'svc1',
    nodeId: 'node1',
    state: 'running' as const,
    desiredState: 'running',
    containerStatus: { containerId: 'c1' },
};

const TASK_FAILED = {
    ID: 'task2',
    serviceId: 'svc1',
    nodeId: 'node2',
    state: 'failed' as const,
    desiredState: 'shutdown',
    containerStatus: null,
};

describe('GET /api/swarm/tasks/', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all tasks without filters', async () => {
        vi.mocked(swarmStateManager.getAllTasks).mockReturnValue([
            TASK_RUNNING,
            TASK_FAILED,
        ] as any);

        const res = await app.request('/api/swarm/tasks');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.tasks).toHaveLength(2);
    });

    it('filters by serviceId', async () => {
        vi.mocked(swarmStateManager.getAllTasks).mockReturnValue([
            TASK_RUNNING,
            TASK_FAILED,
        ] as any);

        const res = await app.request('/api/swarm/tasks?serviceId=svc1');
        const json = await res.json();

        expect(json.tasks).toHaveLength(2);
    });

    it('filters by nodeId', async () => {
        vi.mocked(swarmStateManager.getAllTasks).mockReturnValue([
            TASK_RUNNING,
            TASK_FAILED,
        ] as any);

        const res = await app.request('/api/swarm/tasks?nodeId=node1');
        const json = await res.json();

        expect(json.tasks).toHaveLength(1);
        expect(json.tasks[0].ID).toBe('task1');
    });

    it('filters by state (comma-separated)', async () => {
        vi.mocked(swarmStateManager.getAllTasks).mockReturnValue([
            TASK_RUNNING,
            TASK_FAILED,
        ] as any);

        const res = await app.request('/api/swarm/tasks?state=running');
        const json = await res.json();

        expect(json.tasks).toHaveLength(1);
        expect(json.tasks[0].state).toBe('running');
    });

    it('filters by desiredState', async () => {
        vi.mocked(swarmStateManager.getAllTasks).mockReturnValue([
            TASK_RUNNING,
            TASK_FAILED,
        ] as any);

        const res = await app.request('/api/swarm/tasks?desiredState=shutdown');
        const json = await res.json();

        expect(json.tasks).toHaveLength(1);
        expect(json.tasks[0].desiredState).toBe('shutdown');
    });
});

describe('GET /api/swarm/tasks/:id', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns a specific task', async () => {
        vi.mocked(swarmStateManager.getTask).mockReturnValue(TASK_RUNNING as any);

        const res = await app.request('/api/swarm/tasks/task1');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.task).toEqual(TASK_RUNNING);
    });

    it('returns 404 when task not found', async () => {
        vi.mocked(swarmStateManager.getTask).mockReturnValue(null as any);

        const res = await app.request('/api/swarm/tasks/notexist');
        expect(res.status).toBe(404);
    });
});

describe('GET /api/swarm/tasks/by-service/:serviceId', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns tasks for a given service', async () => {
        vi.mocked(swarmStateManager.getTasksByService).mockReturnValue([TASK_RUNNING] as any);

        const res = await app.request('/api/swarm/tasks/by-service/svc1');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.tasks).toHaveLength(1);
        expect(swarmStateManager.getTasksByService).toHaveBeenCalledWith('svc1');
    });

    it('returns empty array when service has no tasks', async () => {
        vi.mocked(swarmStateManager.getTasksByService).mockReturnValue([]);

        const res = await app.request('/api/swarm/tasks/by-service/empty-svc');
        const json = await res.json();

        expect(json.tasks).toHaveLength(0);
    });
});

describe('GET /api/swarm/tasks/by-node/:nodeId', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns tasks for a given node', async () => {
        vi.mocked(swarmStateManager.getTasksByNode).mockReturnValue([TASK_RUNNING] as any);

        const res = await app.request('/api/swarm/tasks/by-node/node1');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.tasks).toHaveLength(1);
        expect(swarmStateManager.getTasksByNode).toHaveBeenCalledWith('node1');
    });
});

describe('GET /api/swarm/tasks/:id/logs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('returns logs from the task container', async () => {
        vi.mocked(swarmStateManager.getTask).mockReturnValue(TASK_RUNNING as any);
        mockContainer.logs.mockResolvedValue(Buffer.from('task log\n'));

        const res = await app.request('/api/swarm/tasks/task1/logs');
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.logs).toBe('task log\n');
        expect(mockContainer.logs).toHaveBeenCalledWith({
            stdout: true,
            stderr: true,
            tail: 100,
            timestamps: false,
        });
    });

    it('respects tail and timestamps query params', async () => {
        vi.mocked(swarmStateManager.getTask).mockReturnValue(TASK_RUNNING as any);
        mockContainer.logs.mockResolvedValue(Buffer.from(''));

        await app.request('/api/swarm/tasks/task1/logs?tail=50&timestamps=true');

        expect(mockContainer.logs).toHaveBeenCalledWith({
            stdout: true,
            stderr: true,
            tail: 50,
            timestamps: true,
        });
    });

    it('returns 404 when task not found', async () => {
        vi.mocked(swarmStateManager.getTask).mockReturnValue(null as any);

        const res = await app.request('/api/swarm/tasks/notexist/logs');
        expect(res.status).toBe(404);
    });

    it('returns 400 when task has no container', async () => {
        vi.mocked(swarmStateManager.getTask).mockReturnValue(TASK_FAILED as any);

        const res = await app.request('/api/swarm/tasks/task2/logs');
        expect(res.status).toBe(400);
    });

    it('returns 404 when container has been removed (statusCode 404)', async () => {
        vi.mocked(swarmStateManager.getTask).mockReturnValue(TASK_RUNNING as any);
        mockContainer.logs.mockRejectedValueOnce(
            Object.assign(new Error('No such container'), { statusCode: 404 }),
        );

        const res = await app.request('/api/swarm/tasks/task1/logs');
        expect(res.status).toBe(404);
    });
});
