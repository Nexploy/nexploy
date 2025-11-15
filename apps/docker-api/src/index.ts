import { Hono } from 'hono';
import { logger } from './utils/logger';
import { cors } from 'hono/cors';
import containerRoutes from './routes/containerRoutes';
import composeStackRoutes from './routes/composeStackRoutes';
import imagesRoutes from './routes/imagesRoutes';
import containersRoutes from './routes/containersRoutes';
import containersEvents from './routes/events/containersEvents';
import containerEvents from './routes/events/containerEvents';
import dockerStatusEvents from './routes/events/dockerStatusEvents';
import volumesEvents from './routes/events/volumesEvents';
import eventsEvents from './routes/events/eventsEvents';
import imagesEvents from './routes/events/imagesEvents';
import { serve } from '@hono/node-server';
import { setupGracefulShutdown } from './utils/shutdown';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { containersStateManager } from '@/managers/containersStateManager';
import dockerStatusRoutes from '@/routes/dockerStatusRoutes';
import { eventsStateManager } from '@/managers/eventsStateManager';
import { volumesStateManager } from '@/managers/volumesStateManager';
import networksEvents from '@/routes/events/networksEvents';
import { networksStateManager } from '@/managers/networksStateManager';
import { createNodeWebSocket } from '@hono/node-ws';
import { createTerminalRoutes } from '@/routes/terminalRoutes';
import volumesRoutes from '@/routes/volumesRoutes';
import networksRoutes from '@/routes/networksRoutes';

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use(
    '/api/*/events/*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
        credentials: true,
    }),
);

app.route('/api/docker/events', dockerStatusEvents);
app.route('/api/docker', dockerStatusRoutes);

app.route('/api/containers/events', containersEvents);
app.route('/api/containers', containersRoutes);

app.route('/api/container/events', containerEvents);
app.route('/api/container', containerRoutes);

app.route('/api/composes', composeStackRoutes);

app.route('/api/images/events', imagesEvents);
app.route('/api/images', imagesRoutes);

app.route('/api/volumes/events', volumesEvents);
app.route('/api/volumes', volumesRoutes);

app.route('/api/networks/events', networksEvents);
app.route('/api/networks', networksRoutes);

app.route('/api/events/events', eventsEvents);

app.route('/ws/docker', createTerminalRoutes(upgradeWebSocket));

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
            containersStateManager.start(),
            imagesStateManager.start(),
            volumesStateManager.start(),
            networksStateManager.start(),
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

    await Promise.all([
        dockerStatusManager.stop(),
        containersStateManager.stop(),
        imagesStateManager.stop(),
        volumesStateManager.stop(),
        networksStateManager.stop(),
        eventsStateManager.stop(),
    ]);

    logger.info('Docker management services stopped');
});

startServer().then((app) => {
    const port = 3300;

    const server = serve({
        fetch: app.fetch,
        port,
    });

    injectWebSocket(server);

    logger.info(`🚀 Server running on http://localhost:${port}`);
    logger.info(`🔌 WebSocket available`);
});
