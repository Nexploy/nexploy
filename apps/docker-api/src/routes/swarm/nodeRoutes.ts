import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { HttpError } from '@workspace/shared/http-error';
import { zValidator } from '@hono/zod-validator';
import { nodeIdParamSchema } from '@workspace/schemas-zod/docker/swarm/nodeAction.schema';
import { getValidatedParam } from '@/helpers/validation';

const app = new Hono();

app.post(
    '/:id/promote',
    zValidator('param', nodeIdParamSchema),
    handleAsync(async (c) => {
        const { id: nodeId } = getValidatedParam(c, nodeIdParamSchema);

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        if (nodeInfo.Spec.Role === 'manager') {
            throw new HttpError('Node is already a manager.', 400);
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
    zValidator('param', nodeIdParamSchema),
    handleAsync(async (c) => {
        const { id: nodeId } = getValidatedParam(c, nodeIdParamSchema);

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        if (nodeInfo.Spec.Role === 'worker') {
            throw new HttpError('Node is already a worker.', 400);
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
    zValidator('param', nodeIdParamSchema),
    handleAsync(async (c) => {
        const { id: nodeId } = getValidatedParam(c, nodeIdParamSchema);

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
    zValidator('param', nodeIdParamSchema),
    handleAsync(async (c) => {
        const { id: nodeId } = getValidatedParam(c, nodeIdParamSchema);

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
    zValidator('param', nodeIdParamSchema),
    handleAsync(async (c) => {
        const { id: nodeId } = getValidatedParam(c, nodeIdParamSchema);

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

app.delete(
    '/:id',
    zValidator('param', nodeIdParamSchema),
    handleAsync(async (c) => {
        const { id: nodeId } = getValidatedParam(c, nodeIdParamSchema);

        let force = false;
        try {
            const body = await c.req.json();
            force = !!body?.force;
        } catch {
            force = false;
        }

        const node = docker.getNode(nodeId);
        await node.remove({ force });

        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

export default app;
