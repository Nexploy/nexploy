import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from './utils/logger';
import { cors } from 'hono/cors';
import containerRoutes from './routes/containers/containerRoutes';
import imagesRoutes from './routes/images/imagesRoutes';
import containersRoutes from './routes/containers/containersRoutes';
import containersEvents from './routes/containers/events/containersEvents';
import containerEvents from './routes/containers/events/containerEvents';
import imageEvents from './routes/images/events/imageEvents';
import dockerStatusEvents from './routes/events/dockerStatusEvents';
import volumeEvents from './routes/volumes/events/volumeEvents';
import volumesEvents from './routes/volumes/events/volumesEvents';
import eventsEvents from './routes/events/eventsEvents';
import imagesEvents from './routes/images/events/imagesEvents';
import { serve } from '@hono/node-server';
import { setupGracefulShutdown } from './utils/shutdown';
import { DockerStatusManager } from '@/managers/dockerStatusManager';
import { loadEnvironmentsFromAPI } from '@/lib/loadEnvironments';
import networkEvents from '@/routes/networks/events/networkEvents';
import networksEvents from '@/routes/networks/events/networksEvents';
import { createNodeWebSocket } from '@hono/node-ws';
import { createTerminalRoutes } from '@/routes/terminalRoutes';
import volumesRoutes from '@/routes/volumes/volumesRoutes';
import networksRoutes from '@/routes/networks/networksRoutes';
import pipelineEvents from '@/routes/events/pipelineEvents';
import pipelineRoutes from '@/routes/pipelineRoutes';
import swarmRoutes from '@/routes/swarm';
import swarmEvents from '@/routes/swarm/events/swarmEvents';
import serviceEvents from '@/routes/swarm/events/serviceEvents';
import nodeEvents from '@/routes/swarm/events/nodeEvents';
import traefikEvents from '@/routes/events/traefikEvents';
import composeRoutes from './routes/composeRoutes';
import environmentsRoutes from '@/routes/environments.routes';
import backupsRoutes from '@/routes/backupsRoutes';
import registriesRoutes from '@/routes/registriesRoutes';
import systemRoutes from '@/routes/system/systemRoutes';
import { dockerEnvironmentMiddleware } from '@/middleware/dockerEnvironment.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { securityHeadersMiddleware } from '@/middleware/securityHeaders.middleware';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { ContainersStateManager } from '@/managers/list/containersStateManager';
import { ImagesStateManager } from '@/managers/list/imagesStateManager';
import { VolumesStateManager } from '@/managers/list/volumesStateManager';
import { NetworksStateManager } from '@/managers/list/networksStateManager';
import { EventsStateManager } from '@/managers/list/eventsStateManager';
import { SwarmStateManager } from '@/managers/list/swarmStateManager';
import { TraefikLogsManager } from '@/managers/traefikLogsManager';
import { TRAEFIK_NETWORK_NAME } from '@/lib/config';

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use('*', securityHeadersMiddleware);
app.use('*', authMiddleware);
app.use('*', dockerEnvironmentMiddleware);

app.use(
    '/api/*/events/*',
    cors({
        origin: process.env.NEXPLOY_API_URL || 'http://localhost:3000',
        allowMethods: ['GET', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'X-Docker-Environment', 'Authorization'],
        credentials: true,
    }),
);

app.route('/api/docker/events', dockerStatusEvents);

app.route('/api/containers/events', containersEvents);
app.route('/api/containers', containersRoutes);

app.route('/api/container/events', containerEvents);
app.route('/api/container', containerRoutes);

app.route('/api/composes', composeRoutes);

app.route('/api/image/events', imageEvents);

app.route('/api/images/events', imagesEvents);
app.route('/api/images', imagesRoutes);

app.route('/api/volume/events', volumeEvents);
app.route('/api/volumes/events', volumesEvents);
app.route('/api/volumes', volumesRoutes);

app.route('/api/network/events', networkEvents);
app.route('/api/networks/events', networksEvents);
app.route('/api/networks', networksRoutes);

app.route('/api/pipeline/events', pipelineEvents);
app.route('/api/pipeline', pipelineRoutes);

app.route('/api/swarm/events', swarmEvents);
app.route('/api/swarm', swarmRoutes);

app.route('/api/service/events', serviceEvents);
app.route('/api/node/events', nodeEvents);

app.route('/api/traefik/events', traefikEvents);

app.route('/api/events/events', eventsEvents);

app.route('/api/environments', environmentsRoutes);

app.route('/api/backups', backupsRoutes);
app.route('/api/registries', registriesRoutes);
app.route('/api/system', systemRoutes);

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

        const defaultEnvironment = environments.find((env) => env.isDefault);
        if (defaultEnvironment && registeredEnvironmentIds.includes(defaultEnvironment.id)) {
            try {
                await stateManagerFactory
                    .getManagers(defaultEnvironment.id)
                    .networks.createNetworkIfMissing(TRAEFIK_NETWORK_NAME);
                logger.info({ network: TRAEFIK_NETWORK_NAME }, '✓ Traefik network ready');
            } catch (err) {
                logger.error({ err, network: TRAEFIK_NETWORK_NAME }, 'Failed to provision Traefik network');
            }
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
