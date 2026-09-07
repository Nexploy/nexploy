import type { Server } from 'node:net';
import type { MuxSession } from '@nexploy/agent/protocol';
import { logger } from '@/utils/logger';
import { startAgentBridge, stopAgentBridge } from '@/lib/agentBridge';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { loadEnvironmentByIdFromAPI } from '@/lib/loadEnvironments';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';

interface AgentTunnel {
    environmentId: string;
    agentId: string;
    session: MuxSession;
    server: Server;
}

class AgentTunnelRegistry {
    private tunnels: Map<string, AgentTunnel> = new Map();

    has(environmentId: string): boolean {
        return this.tunnels.has(environmentId);
    }

    getAgentId(environmentId: string): string | null {
        return this.tunnels.get(environmentId)?.agentId ?? null;
    }

    async attach(environmentId: string, agentId: string, session: MuxSession): Promise<void> {
        if (this.tunnels.has(environmentId)) {
            logger.warn({ environmentId }, 'A tunnel is already attached for this environment, replacing it');
            await this.detach(environmentId);
        }

        const server = await startAgentBridge(environmentId, session);

        this.tunnels.set(environmentId, { environmentId, agentId, session, server });
        dockerClientRegistry.markAgentBridgeReady(environmentId);

        const config =
            dockerClientRegistry.getEnvironmentConfig(environmentId) ??
            (await loadEnvironmentByIdFromAPI(environmentId));

        if (!config) {
            logger.error({ environmentId }, 'Agent connected for an unknown environment');
            await this.detach(environmentId);
            throw new Error(`Unknown environment ${environmentId}`);
        }

        await dockerClientRegistry.registerEnvironment(config);
        await stateManagerFactory.initializeEnvironment(environmentId);

        if (config.isDefault) {
            dockerClientRegistry.setDefaultEnvironment(environmentId);
        }

        logger.info({ environmentId, agentId, name: config.name }, 'Agent environment is online');
    }

    async detach(environmentId: string, session?: MuxSession): Promise<void> {
        const tunnel = this.tunnels.get(environmentId);

        if (!tunnel) return;
        if (session && tunnel.session !== session) {
            logger.warn({ environmentId }, 'Ignoring the close of a stale agent tunnel');
            return;
        }

        this.tunnels.delete(environmentId);

        await stateManagerFactory.shutdownEnvironment(environmentId).catch((error: unknown) => {
            logger.error({ error, environmentId }, 'Failed to shut down the state managers of the agent environment');
        });

        dockerClientRegistry.markAgentBridgeGone(environmentId);

        tunnel.session.close('Agent disconnected');

        await stopAgentBridge(tunnel.server, environmentId).catch((error: unknown) => {
            logger.error({ error, environmentId }, 'Failed to close the agent bridge socket');
        });

        logger.info({ environmentId, agentId: tunnel.agentId }, 'Agent environment is offline');
    }

    async shutdown(): Promise<void> {
        for (const environmentId of [...this.tunnels.keys()]) {
            await this.detach(environmentId);
        }
    }
}

export const agentTunnelRegistry = new AgentTunnelRegistry();
