import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getNetworksStateManager } from '@/managers/list/networksStateManager';
import { logger } from '@/utils/logger';
import { NetworkEvent } from '@workspace/typescript-interface/docker/docker.network';
import { filterInfrastructureNetworks, hidesInfrastructureNetwork } from '@/lib/infrastructureGuard';
import { createInitialStateGate } from '@/utils/initialStateGate';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getNetworksStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

        const handleInitialState = async (networkEvent: NetworkEvent) => {
            try {
                const filteredEvent = {
                    ...networkEvent,
                    networks: networkEvent.networks ? filterInfrastructureNetworks(networkEvent.networks) : undefined,
                };
                await stream.writeSSE({
                    data: JSON.stringify(filteredEvent),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state after reconnection');
                cleanup();
            }
        };

        const handleNetworkAdded = async (networkEvent: NetworkEvent) => {
            if (networkEvent.network && hidesInfrastructureNetwork(networkEvent.network)) {
                return;
            }
            await stream.writeSSE({
                data: JSON.stringify(networkEvent),
                event: 'network-added',
                id: `${Date.now()}`,
            });
        };

        const handleNetworkUpdated = async (networkEvent: NetworkEvent) => {
            if (networkEvent.network && hidesInfrastructureNetwork(networkEvent.network)) {
                return;
            }
            await stream.writeSSE({
                data: JSON.stringify(networkEvent),
                event: 'network-updated',
                id: `${Date.now()}`,
            });
        };

        const handleNetworkRemoved = async (networkEvent: NetworkEvent) => {
            if (networkEvent.network && hidesInfrastructureNetwork(networkEvent.network)) {
                return;
            }
            await stream.writeSSE({
                data: JSON.stringify(networkEvent),
                event: 'network-removed',
                id: `${Date.now()}`,
            });
        };

        const handleStateChange = async (networkEvent: NetworkEvent) => {
            const filteredEvent = {
                ...networkEvent,
                networks: networkEvent.networks ? filterInfrastructureNetworks(networkEvent.networks) : undefined,
            };
            await stream.writeSSE({
                data: JSON.stringify(filteredEvent),
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
                cleanup();
            }
        }, 15000);

        const gate = createInitialStateGate();
        const onInitialState = gate.gate(handleInitialState);
        const onStateChange = gate.gate(handleStateChange);
        const onNetworkAdded = gate.gate(handleNetworkAdded);
        const onNetworkUpdated = gate.gate(handleNetworkUpdated);
        const onNetworkRemoved = gate.gate(handleNetworkRemoved);

        const cleanup = () => {
            clearInterval(heartbeat);

            manager.off('state-change', onStateChange);
            manager.off('initial-state', onInitialState);
            manager.off('network-added', onNetworkAdded);
            manager.off('network-updated', onNetworkUpdated);
            manager.off('network-removed', onNetworkRemoved);
        };

        manager.on('state-change', onStateChange);
        manager.on('initial-state', onInitialState);
        manager.on('network-added', onNetworkAdded);
        manager.on('network-updated', onNetworkUpdated);
        manager.on('network-removed', onNetworkRemoved);

        const allNetworks = manager.getAllNetworks();
        const initialNetworks = filterInfrastructureNetworks(allNetworks);
        await handleInitialState({
            type: 'initial',
            networks: initialNetworks,
            timestamp: Date.now(),
        });
        await gate.release();

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
