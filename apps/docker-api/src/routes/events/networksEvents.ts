import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { networksStateManager } from '@/managers/networksStateManager';
import { logger } from '@/utils/logger';
import { NetworkEvent } from '@workspace/typescript-interface/docker/docker.network';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Network client connected');

        const handleInitialState = async (networkEvent: NetworkEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(networkEvent),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state after reconnection');
                cleanup();
            }
        };

        const handleNetworkAdded = async (networkEvent: NetworkEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(networkEvent),
                event: 'network-added',
                id: `${Date.now()}`,
            });
        };

        const handleNetworkUpdated = async (networkEvent: NetworkEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(networkEvent),
                event: 'network-updated',
                id: `${Date.now()}`,
            });
        };

        const handleNetworkRemoved = async (networkEvent: NetworkEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(networkEvent),
                event: 'network-removed',
                id: `${Date.now()}`,
            });
        };

        const handleStateChange = async (networkEvent: NetworkEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(networkEvent),
                event: 'state-change',
                id: `${Date.now()}`,
            });
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: NetworkEvent = {
                    type: 'heartbeat',
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(heartbeatData),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err }, 'Error sending heartbeat');
                clearInterval(heartbeat);
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);

            networksStateManager.off('state-change', handleStateChange);
            networksStateManager.off('initial-state', handleInitialState);
            networksStateManager.off('network-added', handleNetworkAdded);
            networksStateManager.off('network-updated', handleNetworkUpdated);
            networksStateManager.off('network-removed', handleNetworkRemoved);

            logger.info({ clientId }, 'SSE Network client disconnected');
        };

        const initialNetworks = networksStateManager.getAllNetworks();
        await handleInitialState({
            type: 'initial',
            networks: initialNetworks,
            timestamp: Date.now(),
        });

        networksStateManager.on('state-change', handleStateChange);
        networksStateManager.on('initial-state', handleInitialState);
        networksStateManager.on('network-added', handleNetworkAdded);
        networksStateManager.on('network-updated', handleNetworkUpdated);
        networksStateManager.on('network-removed', handleNetworkRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
