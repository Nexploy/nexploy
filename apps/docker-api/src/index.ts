import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from './utils/logger';
import { cors } from 'hono/cors';
import containerRoutes from './routes/containerRoutes';
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
import { DockerStatusManager } from '@/managers/dockerStatusManager';
import { loadEnvironmentsFromAPI } from '@/lib/loadEnvironments';
import networksEvents from '@/routes/events/networksEvents';
import { createNodeWebSocket } from '@hono/node-ws';
import { createTerminalRoutes } from '@/routes/terminalRoutes';
import volumesRoutes from '@/routes/volumesRoutes';
import networksRoutes from '@/routes/networksRoutes';
import pipelineEvents from '@/routes/events/pipelineEvents';
import pipelineRoutes from '@/routes/pipelineRoutes';
import swarmRoutes from '@/routes/swarm';
import swarmEvents from '@/routes/events/swarmEvents';
import traefikEvents from '@/routes/events/traefikEvents';
import composeRoutes from './routes/composeRoutes';
import environmentsRoutes from '@/routes/environments.routes';
import backupsRoutes from '@/routes/backupsRoutes';
import registriesRoutes from '@/routes/registriesRoutes';
import { dockerEnvironmentMiddleware } from '@/middleware/dockerEnvironment.middleware';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { ContainersStateManager } from '@/managers/containersStateManager';
import { ImagesStateManager } from '@/managers/imagesStateManager';
import { VolumesStateManager } from '@/managers/volumesStateManager';
import { NetworksStateManager } from '@/managers/networksStateManager';
import { EventsStateManager } from '@/managers/eventsStateManager';
import { SwarmStateManager } from '@/managers/swarmStateManager';
import { TraefikLogsManager } from '@/managers/traefikLogsManager';

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use('*', dockerEnvironmentMiddleware);

app.use(
    '/api/*/events/*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'X-Docker-Environment'],
        credentials: true,
    }),
);

app.route('/api/docker/events', dockerStatusEvents);

app.route('/api/containers/events', containersEvents);
app.route('/api/containers', containersRoutes);

app.route('/api/container/events', containerEvents);
app.route('/api/container', containerRoutes);

app.route('/api/composes', composeRoutes);

app.route('/api/images/events', imagesEvents);
app.route('/api/images', imagesRoutes);

app.route('/api/volumes/events', volumesEvents);
app.route('/api/volumes', volumesRoutes);

app.route('/api/networks/events', networksEvents);
app.route('/api/networks', networksRoutes);

app.route('/api/pipeline/events', pipelineEvents);
app.route('/api/pipeline', pipelineRoutes);

app.route('/api/swarm/events', swarmEvents);
app.route('/api/swarm', swarmRoutes);

app.route('/api/traefik/events', traefikEvents);

app.route('/api/events/events', eventsEvents);

app.route('/api/environments', environmentsRoutes);

app.route('/api/backups', backupsRoutes);
app.route('/api/registries', registriesRoutes);

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
        stateManagerFactory.registerConstructors({
            containers: ContainersStateManager,
            images: ImagesStateManager,
            volumes: VolumesStateManager,
            networks: NetworksStateManager,
            events: EventsStateManager,
            swarm: SwarmStateManager,
            traefik: TraefikLogsManager,
            dockerStatus: DockerStatusManager,
        });

        const environments = await loadEnvironmentsFromAPI();

        logger.info('Initializing Docker client registry...');
        const registeredEnvironmentIds = await dockerClientRegistry.initialize(environments);

        logger.info(
            { registeredEnvironmentIds },
            'Initializing state managers for registered environments...',
        );

        const initResults = await Promise.allSettled(
            registeredEnvironmentIds.map((environmentId) =>
                stateManagerFactory.initializeEnvironment(environmentId),
            ),
        );

        const succeeded = initResults.filter((r) => r.status === 'fulfilled').length;
        const failed = initResults.filter((r) => r.status === 'rejected').length;

        if (failed > 0) {
            logger.warn(
                {
                    totalEnvironments: environments.length,
                    registered: registeredEnvironmentIds.length,
                    initialized: succeeded,
                    failed,
                },
                'Some registered environments failed to initialize',
            );
        } else {
            logger.info(
                {
                    totalEnvironments: environments.length,
                    registered: registeredEnvironmentIds.length,
                    initialized: succeeded,
                },
                '✓ All registered environments initialized successfully',
            );
        }

        return app;
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
};

setupGracefulShutdown(async () => {
    logger.info('Shutting down Docker management services...');
    await stateManagerFactory.shutdownAll();
    await dockerClientRegistry.shutdown();
    logger.info('Docker management services stopped');
});

startServer().then((app) => {
    const port = Number(process.env.PORT);

    const server = serve({
        fetch: app.fetch,
        port,
    });

    injectWebSocket(server);

    logger.info(`🚀 Server running on http://localhost:${port}`);
    logger.info(`🔌 WebSocket available`);
});
