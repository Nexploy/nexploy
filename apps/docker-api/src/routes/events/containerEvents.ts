import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { ContainerStateManager } from '@/managers/containerStateManager';
import { ContainerEvent } from '@workspace/typescript-interface/docker/docker.container';
import { ContainerLogsStateManager } from '@/managers/containerLogsStateManager';
import { ContainerLogsEvent } from '@workspace/typescript-interface/stores/containerLogsStore';

const app = new Hono();

app.get('/stream/:containerId', (c) => {
    const containerId = c.req.param('containerId');

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId, containerId }, 'SSE Container client connected');

        const manager = new ContainerStateManager(containerId);

        try {
            await manager.start();
        } catch (err) {
            logger.error({ err, clientId, containerId }, 'Failed to start container monitor');
            await stream.writeSSE({
                data: JSON.stringify({ error: 'Failed to start monitoring' }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        const handleInitialState = async (event: ContainerEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending initial-state');
                cleanup();
            }
        };

        const handleStateChange = async (event: ContainerEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'state-change',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending state-change');
                cleanup();
            }
        };

        const handleRemoved = async (event: ContainerEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'removed',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending removed');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: ContainerEvent = {
                    type: 'heartbeat',
                    containerId,
                    timestamp: Date.now(),
                };
                await stream.writeSSE({
                    data: JSON.stringify(heartbeatData),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
                cleanup();
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);

            manager.off('initial-state', handleInitialState);
            manager.off('state-change', handleStateChange);
            manager.off('removed', handleRemoved);

            logger.info({ clientId, containerId }, 'SSE Container monitor client disconnected');
        };

        const currentState = manager.getCurrentState();
        if (currentState) {
            await handleInitialState({
                type: 'initial',
                containerId,
                container: currentState,
                timestamp: Date.now(),
            });
        }

        manager.on('initial-state', handleInitialState);
        manager.on('state-change', handleStateChange);
        manager.on('removed', handleRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

app.get('/stream/:containerId/logs/:follow/:tail', (c) => {
    const containerId = c.req.param('containerId');

    const follow = true;
    const tail = parseInt(c.req.param('tail') || '500', 10);

    return streamSSE(c, async (stream) => {
        const clientId = `logs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        logger.info({ clientId, containerId, follow, tail }, 'SSE Container logs client connected');

        const logsManager = new ContainerLogsStateManager(containerId);

        try {
            await logsManager.start({ follow, tail });
        } catch (err) {
            logger.error({ err, clientId, containerId }, 'Failed to start logs stream');
            await stream.writeSSE({
                data: JSON.stringify({ error: 'Failed to start logs stream' }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        const handleLog = async (event: ContainerLogsEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: event.type,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending log');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
                cleanup();
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);
            logsManager.off('log', handleLog);
            logsManager.stop();

            logger.info({ clientId, containerId }, 'SSE Container logs client disconnected');
        };

        logsManager.on('log', handleLog);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
