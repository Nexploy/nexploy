import { Hono } from 'hono';
import { logger } from './utils/logger';
import { cors } from 'hono/cors';
import containerRoutes from './routes/containersRoutes';
import composeStackRoutes from './routes/composeStackRoutes';
import imagesRoutes from './routes/imagesRoutes';
import eventsRoutes from './routes/eventsRoutes';
import containerEvents from './routes/events/containerEvents';
import dockerStatusEvents from './routes/events/dockerStatusEvents';
import volumeEvents from './routes/events/volumeEvents';
import eventsEvents from './routes/events/eventsEvents';
import imageEvents from './routes/events/imageEvents';
import { serve } from '@hono/node-server';
import { setupGracefulShutdown } from './utils/shutdown';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { imageStateManager } from '@/managers/imageStateManager';
import { containerStateManager } from '@/managers/containerStateManager';
import dockerStatusRoutes from '@/routes/dockerStatusRoutes';
import { eventsStateManager } from '@/managers/eventsStateManager';
import { volumeStateManager } from '@/managers/volumeStateManager';
import networkEvents from '@/routes/events/networkEvents';
import { networkStateManager } from '@/managers/networkStateManager';

const app = new Hono();

app.use(
    '/api/*/events/*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
        credentials: true,
    }),
);

app.get('/health', (c) => {
    const dockerStatus = dockerStatusManager.getStatus();
    const containerStats = containerStateManager.getStats();
    const imageStats = imageStateManager.getStats();
    const eventsStats = eventsStateManager.getStats();

    return c.json({
        status: 'ok',
        timestamp: Date.now(),
        docker: {
            status: dockerStatus,
            isConnected: dockerStatusManager.isConnected(),
            lastCheck: dockerStatusManager.getLastCheck(),
        },
        containers: {
            count: containerStats.containerCount,
            eventStreamActive: containerStats.eventStreamActive,
            polling: containerStats.polling,
        },
        events: {
            count: eventsStats.eventsReceived,
            eventStreamActive: eventsStats.eventStreamActive,
        },
        images: {
            count: imageStats.imageCount,
            eventStreamActive: imageStats.eventStreamActive,
            polling: imageStats.polling,
        },
    });
});

app.route('/api/docker/events', dockerStatusEvents);
app.route('/api/docker', dockerStatusRoutes);

app.route('/api/containers/events', containerEvents);
app.route('/api/containers', containerRoutes);

app.route('/api/composes', composeStackRoutes);

app.route('/api/images/events', imageEvents);
app.route('/api/images', imagesRoutes);

app.route('/api/volumes/events', volumeEvents);

app.route('/api/networks/events', networkEvents);

app.route('/api/events/events', eventsEvents);
app.route('/api/events', eventsRoutes);

app.onError((err, c) => {
    logger.error({ err }, 'Application error');
    return c.json(
        {
            error: err.message,
            status: 500,
        },
        500,
    );
});

const startServer = async () => {
    try {
        logger.info('Starting all state managers...');
        await Promise.all([
            dockerStatusManager.start(),
            containerStateManager.start(),
            imageStateManager.start(),
            volumeStateManager.start(),
            networkStateManager.start(),
            eventsStateManager.start(),
        ]);

        const dockerStatus = dockerStatusManager.getStatus();
        if (dockerStatus === 'connected') {
            logger.info('✓ Docker daemon is available');
        } else if (dockerStatus === 'disconnected') {
            logger.warn('✗ Docker daemon is not available - running in polling mode');
        } else if (dockerStatus === 'connecting') {
            logger.info('⟳ Connecting to Docker daemon...');
        }

        return app;
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
};

setupGracefulShutdown(async () => {
    logger.info('Shutting down Docker management services...');

    await Promise.all([containerStateManager.stop(), imageStateManager.stop()]);

    dockerStatusManager.stop();

    logger.info('Docker management services stopped');
});

startServer().then((app) => {
    serve({ fetch: app.fetch, port: 3300 }, (info) =>
        logger.info(`🚀 Server running on http://localhost:${info.port}`),
    );
});
