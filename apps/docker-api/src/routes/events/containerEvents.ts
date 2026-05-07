import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { ContainerStateManager } from '@/managers/containerStateManager';
import { ContainerEvent } from '@workspace/typescript-interface/docker/docker.container';
import { ContainerLogsStateManager } from '@/managers/containerLogsStateManager';
import { ContainerLogsEvent } from '@workspace/typescript-interface/docker/docker.container.logs';
import { ContainerStatsStateManager } from '@/managers/containerStatsStateManager';
import { ContainerStatsEvent } from '@workspace/typescript-interface/docker/docker.container.stats';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';

const app = new Hono();

app.get('/stream/:containerId', (c) => {
    const containerId = c.req.param('containerId');

    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;
    const manager = new ContainerStateManager(containerId, environmentId);

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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

        const handleNotFound = async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'not-found', containerId, timestamp: Date.now() }),
                    event: 'not-found',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending not-found');
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
        }, 30000);

        const cleanup = () => {
            clearInterval(heartbeat);

            manager.off('initial-state', handleInitialState);
            manager.off('state-change', handleStateChange);
            manager.off('removed', handleRemoved);
            manager.off('not-found', handleNotFound);
        };

        manager.on('initial-state', handleInitialState);
        manager.on('state-change', handleStateChange);
        manager.on('removed', handleRemoved);
        manager.on('not-found', handleNotFound);

        const currentState = manager.getCurrentState();
        if (currentState) {
            await handleInitialState({
                type: 'initial',
                containerId,
                container: currentState,
                timestamp: Date.now(),
            });
        } else {
            await handleNotFound();
        }

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

app.get('/stream/:containerId/logs/:follow/:tail', (c) => {
    const containerId = c.req.param('containerId');

    const follow = true;
    const tail = parseInt(c.req.param('tail') || '500', 10);

    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;
    const logsManager = new ContainerLogsStateManager(containerId, environmentId);

    return streamSSE(c, async (stream) => {
        const clientId = `logs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
        }, 30000);

        const cleanup = () => {
            clearInterval(heartbeat);
            logsManager.off('log', handleLog);
            logsManager.stop();
        };

        logsManager.on('log', handleLog);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

app.get('/stream/:containerId/stats/:refreshRate', (c) => {
    const containerId = c.req.param('containerId');
    const refreshRate = parseInt(c.req.param('refreshRate'), 10);

    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;
    const statsManager = new ContainerStatsStateManager(containerId, environmentId, refreshRate);

    return streamSSE(c, async (stream) => {
        const clientId = `stats-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        try {
            await statsManager.start();
        } catch (err) {
            logger.error({ err, clientId, containerId }, 'Failed to start stats stream');
            await stream.writeSSE({
                data: JSON.stringify({ error: 'Failed to start stats stream' }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        const handleInitialState = async (event: ContainerStatsEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending initial stats');
                cleanup();
            }
        };

        const handleStatsUpdate = async (event: ContainerStatsEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'stats-update',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, containerId }, 'Error sending stats update');
                cleanup();
            }
        };

        const handleRemoved = async (event: ContainerStatsEvent) => {
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
        }, 30000);

        const cleanup = () => {
            clearInterval(heartbeat);

            statsManager.off('initial-state', handleInitialState);
            statsManager.off('stats-update', handleStatsUpdate);
            statsManager.off('removed', handleRemoved);
            statsManager.stop();
        };

        const currentStats = statsManager.getCurrentState();
        if (currentStats) {
            await handleInitialState({
                type: 'initial-state',
                containerId,
                stats: currentStats,
                timestamp: Date.now(),
            });
        }

        statsManager.on('initial-state', handleInitialState);
        statsManager.on('stats-update', handleStatsUpdate);
        statsManager.on('removed', handleRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
