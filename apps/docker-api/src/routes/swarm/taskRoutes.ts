import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import type { SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { getTranslations } from '@/middleware/locale.middleware';
import { HttpError } from '@workspace/shared/http-error';

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

app.get(
    '/:id',
    handleAsync(async (c) => {
        const taskId = c.req.param('id');
        const task = swarmStateManager.getTask(taskId);

        if (!task) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.taskNotFound'), 404);
        }

        return { task };
    }),
);

app.get(
    '/by-service/:serviceId',
    handleAsync(async (c) => {
        const serviceId = c.req.param('serviceId');
        const tasks = swarmStateManager.getTasksByService(serviceId);
        return { tasks };
    }),
);

app.get(
    '/by-node/:nodeId',
    handleAsync(async (c) => {
        const nodeId = c.req.param('nodeId');
        const tasks = swarmStateManager.getTasksByNode(nodeId);
        return { tasks };
    }),
);

app.get(
    '/:id/logs',
    handleAsync(async (c) => {
        const taskId = c.req.param('id');
        const tail = c.req.query('tail') || '100';
        const timestamps = c.req.query('timestamps') === 'true';

        const task = swarmStateManager.getTask(taskId);
        if (!task) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.taskNotFound'), 404);
        }

        if (!task.containerStatus?.containerId) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.taskNoContainer'), 400);
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
                const t = getTranslations(c, 'docker');
                throw new HttpError(t('errors.containerRemoved'), 404);
            }
            throw err;
        }
    }),
);

export default app;
