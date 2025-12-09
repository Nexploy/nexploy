import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';

const app = new Hono();

// List all nodes
app.get(
    '/',
    handleAsync(async () => {
        return { nodes: swarmStateManager.getAllNodes() };
    }),
);

// Get node details
app.get(
    '/:id',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');
        const node = swarmStateManager.getNode(nodeId);

        if (!node) {
            return c.json({ error: 'Node not found' }, 404);
        }

        const tasks = swarmStateManager.getTasksByNode(nodeId);
        return { node, tasks };
    }),
);

// Update node (availability, role, labels)
app.patch(
    '/:id',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');
        const { availability, role, labels } = await c.req.json();

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        const spec: any = { ...nodeInfo.Spec };

        if (availability) {
            spec.Availability = availability.charAt(0).toUpperCase() + availability.slice(1);
        }
        if (role) {
            spec.Role = role.charAt(0).toUpperCase() + role.slice(1);
        }
        if (labels !== undefined) {
            spec.Labels = labels;
        }

        node.update({
            version: nodeInfo.Version.Index,
            ...spec,
        });

        await swarmStateManager.hardRefresh();
        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

// Delete node
app.delete(
    '/:id',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');
        const { force } = await c.req.json().catch(() => ({ force: false }));

        const node = docker.getNode(nodeId);
        await node.remove({ force });

        return { success: true, nodeId };
    }),
);

// Promote worker to manager
app.post(
    '/:id/promote',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        if (nodeInfo.Spec.Role === 'manager') {
            return c.json({ error: 'Node is already a manager' }, 400);
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

// Demote manager to worker
app.post(
    '/:id/demote',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        if (nodeInfo.Spec.Role === 'worker') {
            return c.json({ error: 'Node is already a worker' }, 400);
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

// Set node to drain
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

// Set node to active
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

// Set node to pause
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

// Update node labels
app.put(
    '/:id/labels',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');
        const { labels, merge = true } = await c.req.json();

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        const newLabels = merge ? { ...nodeInfo.Spec.Labels, ...labels } : labels;

        node.update({
            version: nodeInfo.Version.Index,
            ...nodeInfo.Spec,
            Labels: newLabels,
        });

        await swarmStateManager.hardRefresh();
        const updatedNode = swarmStateManager.getNode(nodeId);

        return { success: true, node: updatedNode };
    }),
);

export default app;
