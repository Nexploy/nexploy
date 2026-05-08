import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import { swarmStateManager } from '@/managers/list/swarmStateManager';
import { HttpError } from '@workspace/shared/http-error';
import {
    nodeDeleteBodySchema,
    nodeIdParamSchema,
} from '@workspace/schemas-zod/docker/swarm/nodeAction.schema';

const app = new Hono();

app.post(
    '/:id/promote',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');

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

        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/demote',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');

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

        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/drain',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Availability: 'drain',
        });

        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/activate',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Availability: 'active',
        });

        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.post(
    '/:id/pause',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Availability: 'pause',
        });

        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

app.delete(
    '/:id',
    route({ param: nodeIdParamSchema, json: nodeDeleteBodySchema }, async (c) => {
        const { id } = c.req.valid('param');
        const { force } = c.req.valid('json');

        const node = docker.getNode(id);
        await node.remove({ force });

        return { success: true };
    }),
);

export default app;
