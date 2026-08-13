import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import { swarmStateManager } from '@/managers/list/swarmStateManager';
import { HttpError } from '@nexploy/shared/http-error';
import { nodeDeleteBodySchema, nodeIdParamSchema } from '@workspace/schemas-zod/docker/swarm/nodeAction.schema';
import { runUserTask } from '@/lib/taskRunner';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import type { TaskKind } from '@workspace/typescript-interface/task';

const app = new Hono();

type NodeAvailability = 'active' | 'pause' | 'drain';

const AVAILABILITY_TASK_KINDS: Record<NodeAvailability, TaskKind> = {
    active: 'swarm-node-activate',
    pause: 'swarm-node-pause',
    drain: 'swarm-node-drain',
};

function nodeSubjectName(nodeId: string): string {
    return swarmStateManager.getNode(nodeId)?.hostname ?? nodeId;
}

async function setNodeAvailability(nodeId: string, availability: NodeAvailability) {
    return runUserTask({
        kind: AVAILABILITY_TASK_KINDS[availability],
        subjectName: nodeSubjectName(nodeId),
        stepKeys: [],
        environmentId: getCurrentEnvironmentId(),
        run: async () => {
            const node = docker.getNode(nodeId);
            const nodeInfo = await node.inspect();

            await node.update({
                version: nodeInfo.Version.Index,
                ...nodeInfo.Spec,
                Availability: availability,
            });

            return { success: true, node: swarmStateManager.getNode(nodeId) };
        },
    });
}

async function setNodeRole(nodeId: string, role: 'manager' | 'worker') {
    const node = docker.getNode(nodeId);
    const nodeInfo = await node.inspect();

    if (nodeInfo.Spec.Role === role) {
        throw new HttpError(role === 'manager' ? 'Node is already a manager.' : 'Node is already a worker.', 400);
    }

    return runUserTask({
        kind: role === 'manager' ? 'swarm-node-promote' : 'swarm-node-demote',
        subjectName: nodeSubjectName(nodeId),
        stepKeys: [],
        environmentId: getCurrentEnvironmentId(),
        run: async () => {
            await node.update({
                version: nodeInfo.Version.Index,
                ...nodeInfo.Spec,
                Role: role,
            });

            return { success: true, node: swarmStateManager.getNode(nodeId) };
        },
    });
}

app.get(
    '/',
    route(async () => {
        return swarmStateManager.getAllNodes();
    }),
);

app.post(
    '/:id/promote',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');
        return setNodeRole(nodeId, 'manager');
    }),
);

app.post(
    '/:id/demote',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');
        return setNodeRole(nodeId, 'worker');
    }),
);

app.post(
    '/:id/drain',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');
        return setNodeAvailability(nodeId, 'drain');
    }),
);

app.post(
    '/:id/activate',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');
        return setNodeAvailability(nodeId, 'active');
    }),
);

app.post(
    '/:id/pause',
    route({ param: nodeIdParamSchema }, async (c) => {
        const { id: nodeId } = c.req.valid('param');
        return setNodeAvailability(nodeId, 'pause');
    }),
);

app.delete(
    '/:id',
    route({ param: nodeIdParamSchema, json: nodeDeleteBodySchema }, async (c) => {
        const { id } = c.req.valid('param');
        const { force } = c.req.valid('json');

        return runUserTask({
            kind: 'swarm-node-remove',
            subjectName: nodeSubjectName(id),
            stepKeys: [],
            environmentId: getCurrentEnvironmentId(),
            run: async () => {
                await docker.getNode(id).remove({ force });
                return { success: true };
            },
        });
    }),
);

export default app;
