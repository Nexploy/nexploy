import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { getSwarmStateManager } from '@/managers/list/swarmStateManager';
import type { NodeDetailEvent, SwarmEvent } from '@workspace/typescript-interface/docker/swarm';

const app = new Hono();

app.get('/stream/:nodeId', (c) => {
    const nodeId = decodeURIComponent(c.req.param('nodeId'));
    const manager = getSwarmStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

        const sendEvent = async (event: NodeDetailEvent, eventName: string) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: eventName,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, nodeId }, `Error sending ${eventName}`);
                cleanup();
            }
        };

        const handleNodeUpdated = (event: SwarmEvent) => {
            if (event.type !== 'node-updated' || event.node.id !== nodeId) return;
            const tasks = manager.getTasksByNode(nodeId);
            sendEvent(
                { type: 'node-updated', nodeId, node: event.node, tasks, timestamp: event.timestamp },
                'node-updated',
            );
        };

        const handleNodeRemoved = (event: SwarmEvent) => {
            if (event.type !== 'node-removed' || event.nodeId !== nodeId) return;
            sendEvent({ type: 'node-removed', nodeId, timestamp: event.timestamp }, 'node-removed');
        };

        const handleTaskAdded = (event: SwarmEvent) => {
            if (event.type !== 'task-added' || event.task.nodeId !== nodeId) return;
            const node = manager.getNode(nodeId);
            const tasks = manager.getTasksByNode(nodeId);
            sendEvent({ type: 'node-updated', nodeId, node, tasks, timestamp: event.timestamp }, 'node-updated');
        };

        const handleTaskUpdated = (event: SwarmEvent) => {
            if (event.type !== 'task-updated' || event.task.nodeId !== nodeId) return;
            const node = manager.getNode(nodeId);
            const tasks = manager.getTasksByNode(nodeId);
            sendEvent({ type: 'node-updated', nodeId, node, tasks, timestamp: event.timestamp }, 'node-updated');
        };

        const handleTaskRemoved = (event: SwarmEvent) => {
            if (event.type !== 'task-removed' || event.previousTask.nodeId !== nodeId) return;
            const node = manager.getNode(nodeId);
            const tasks = manager.getTasksByNode(nodeId);
            sendEvent({ type: 'node-updated', nodeId, node, tasks, timestamp: event.timestamp }, 'node-updated');
        };

        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'heartbeat', nodeId, timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, nodeId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
                cleanup();
            }
        }, 30000);

        const cleanup = () => {
            clearInterval(heartbeat);
            manager.off('node-updated', handleNodeUpdated);
            manager.off('node-removed', handleNodeRemoved);
            manager.off('task-added', handleTaskAdded);
            manager.off('task-updated', handleTaskUpdated);
            manager.off('task-removed', handleTaskRemoved);
        };

        manager.on('node-updated', handleNodeUpdated);
        manager.on('node-removed', handleNodeRemoved);
        manager.on('task-added', handleTaskAdded);
        manager.on('task-updated', handleTaskUpdated);
        manager.on('task-removed', handleTaskRemoved);

        const node = manager.getNode(nodeId);
        const tasks = manager.getTasksByNode(nodeId);

        if (!manager.getIsSwarmActive() || !node) {
            await sendEvent({ type: 'not-found', nodeId, timestamp: Date.now() }, 'not-found');
        } else {
            await sendEvent(
                { type: 'initial-state', nodeId, node, tasks, timestamp: Date.now() },
                'initial-state',
            );
        }

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
