import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getNetworksStateManager } from '@/managers/networksStateManager';
import { logger } from '@/utils/logger';
import { NetworkEvent } from '@workspace/typescript-interface/docker/docker.network';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getNetworksStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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

            manager.off('state-change', handleStateChange);
            manager.off('initial-state', handleInitialState);
            manager.off('network-added', handleNetworkAdded);
            manager.off('network-updated', handleNetworkUpdated);
            manager.off('network-removed', handleNetworkRemoved);
        };

        const initialNetworks = manager.getAllNetworks();
        await handleInitialState({
            type: 'initial',
            networks: initialNetworks,
            timestamp: Date.now(),
        });

        manager.on('state-change', handleStateChange);
        manager.on('initial-state', handleInitialState);
        manager.on('network-added', handleNetworkAdded);
        manager.on('network-updated', handleNetworkUpdated);
        manager.on('network-removed', handleNetworkRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
