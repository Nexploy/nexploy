import { Hono } from 'hono';
import { logger } from './utils/logger';
import { cors } from 'hono/cors';
import containerRoutes from './routes/containers';
import containerEventsRoutes from './routes/containerEvents';
import { containerStateManager } from './services/containerStateManager';
import { serve } from '@hono/node-server';
import { setupGracefulShutdown } from './utils/shutdown';

const app = new Hono();

app.use(
    '/api/containers/events/*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
        credentials: true,
    }),
);

// app.get('/health', (c) => {
//     return c.json({
//         status: 'ok',
//         timestamp: Date.now(),
//         stateManager: {
//             running: containerStateManager.listenerCount('state-change') > 0,
//             containers: containerStateManager.getAllStates().length
//         }
//     })
// })

app.route('/api/containers/events', containerEventsRoutes);
app.route('/api/containers', containerRoutes);

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
        logger.info('Starting container state manager...');
        await containerStateManager.start();
        logger.info('Container state manager started successfully');

        return app;
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
};

setupGracefulShutdown();

startServer().then((app) => {
    serve({ fetch: app.fetch, port: 3300 }, (info) =>
        logger.info(`Server running on http://localhost:${info.port}`),
    );
});
