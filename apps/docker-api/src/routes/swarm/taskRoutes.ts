import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import type { SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';
import { swarmStateManager } from '@/managers/swarmStateManager';

const app = new Hono();

app.get(
    '/',
    handleAsync(async (c) => {
        const serviceId = c.req.query('serviceId');
        const nodeId = c.req.query('nodeId');
        const state = c.req.query('state');
        const desiredState = c.req.query('desiredState');

        let tasks = swarmStateManager.getAllTasks();

        if (serviceId) {
            tasks = tasks.filter((t) => t.serviceId === serviceId);
        }
        if (nodeId) {
            tasks = tasks.filter((t) => t.nodeId === nodeId);
        }
        if (state) {
            const states = state.split(',') as SwarmTaskState[];
            tasks = tasks.filter((t) => states.includes(t.state));
        }
        if (desiredState) {
            tasks = tasks.filter((t) => t.desiredState === desiredState);
        }

        return { tasks };
    }),
);

// Get task details
app.get(
    '/:id',
    handleAsync(async (c) => {
        const taskId = c.req.param('id');
        const task = swarmStateManager.getTask(taskId);

        if (!task) {
            return c.json({ error: 'Task not found' }, 404);
        }

        return { task };
    }),
);

// Get tasks by service
app.get(
    '/by-service/:serviceId',
    handleAsync(async (c) => {
        const serviceId = c.req.param('serviceId');
        const tasks = swarmStateManager.getTasksByService(serviceId);
        return { tasks };
    }),
);

// Get tasks by node
app.get(
    '/by-node/:nodeId',
    handleAsync(async (c) => {
        const nodeId = c.req.param('nodeId');
        const tasks = swarmStateManager.getTasksByNode(nodeId);
        return { tasks };
    }),
);

// Get task logs (via container if available)
app.get(
    '/:id/logs',
    handleAsync(async (c) => {
        const taskId = c.req.param('id');
        const tail = c.req.query('tail') || '100';
        const timestamps = c.req.query('timestamps') === 'true';

        const task = swarmStateManager.getTask(taskId);
        if (!task) {
            return c.json({ error: 'Task not found' }, 404);
        }

        if (!task.containerStatus?.containerId) {
            return c.json({ error: 'Task has no container' }, 400);
        }

        try {
            const container = docker.getContainer(task.containerStatus.containerId);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail: parseInt(tail),
                timestamps,
            });

            return { logs: logs.toString() };
        } catch (err: any) {
            if (err.statusCode === 404) {
                return c.json({ error: 'Container not found (may have been removed)' }, 404);
            }
            throw err;
        }
    }),
);

export default app;
