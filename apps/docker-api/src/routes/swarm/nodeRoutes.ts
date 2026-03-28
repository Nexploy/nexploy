import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { getTranslations } from '@/middleware/locale.middleware';
import { HttpError } from '@workspace/shared/http-error';

const app = new Hono();

app.post(
    '/:id/promote',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        if (nodeInfo.Spec.Role === 'manager') {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.nodeAlreadyManager'), 400);
        }

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Role: 'manager',
        });

        await swarmStateManager.hardRefresh();
        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/demote',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        if (nodeInfo.Spec.Role === 'worker') {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.nodeAlreadyWorker'), 400);
        }

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Role: 'worker',
        });

        await swarmStateManager.hardRefresh();
        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/drain',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Availability: 'drain',
        });

        await swarmStateManager.hardRefresh();
        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/activate',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Availability: 'active',
        });

        await swarmStateManager.hardRefresh();
        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/pause',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Availability: 'pause',
        });

        await swarmStateManager.hardRefresh();
        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

export default app;
