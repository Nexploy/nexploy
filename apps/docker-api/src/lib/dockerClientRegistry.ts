import Docker from 'dockerode';
import { logger } from '@/utils/logger';
import { defaultDocker } from '@/utils/dockerClient';

export interface EnvironmentConfig {
    id: string;
    name: string;
    connectionType: 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
    socketPath?: string;
    host?: string;
    port?: number;
    tlsCert?: string; // Encrypted
    tlsKey?: string; // Encrypted
    tlsCa?: string; // Encrypted
    isDefault?: boolean;
}

class DockerClientRegistry {
    private clients: Map<string, Docker> = new Map();
    private defaultEnvironmentId: string | null = null;
    private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Initialize registry with environments from database
     */
    async initialize(environments: EnvironmentConfig[]): Promise<void> {
        logger.info({ count: environments.length }, 'Initializing Docker client registry');

        for (const config of environments) {
            try {
                await this.registerEnvironment(config);

                if (config.isDefault) {
                    this.defaultEnvironmentId = config.id;
                }
            } catch (err) {
                logger.error({ err, environmentId: config.id }, 'Failed to register environment');
            }
        }

        // Ensure we have a default
        if (!this.defaultEnvironmentId && environments.length > 0) {
            this.defaultEnvironmentId = environments[0].id;
            logger.warn(
                { environmentId: environments[0].id },
                'No default environment found, using first environment',
            );
        }

        // If default environment exists, register the legacy default client
        if (this.defaultEnvironmentId && !this.clients.has(this.defaultEnvironmentId)) {
            this.clients.set(this.defaultEnvironmentId, defaultDocker);
        }
    }

    /**
     * Register a new Docker environment
     */
    async registerEnvironment(config: EnvironmentConfig): Promise<Docker> {
        const client = this.createClient(config);

        // Test connection
        try {
            await client.ping();
            logger.info({ environmentId: config.id, name: config.name }, 'Environment connected');
        } catch (err) {
            logger.warn({ err, environmentId: config.id }, 'Environment connection failed');
            // Still register it - might come online later
        }

        this.clients.set(config.id, client);

        // Start health checks
        this.startHealthCheck(config.id);

        return client;
    }

    /**
     * Create Docker client from config
     */
    private createClient(config: EnvironmentConfig): Docker {
        switch (config.connectionType) {
            case 'UNIX_SOCKET':
                return new Docker({ socketPath: config.socketPath });

            case 'TCP':
                return new Docker({
                    host: config.host,
                    port: config.port,
                });

            case 'TCP_TLS':
                // Decrypt TLS credentials
                const cert = this.decryptValue(config.tlsCert!);
                const key = this.decryptValue(config.tlsKey!);
                const ca = this.decryptValue(config.tlsCa!);

                return new Docker({
                    host: config.host,
                    port: config.port,
                    ca: ca,
                    cert: cert,
                    key: key,
                });

            default:
                throw new Error(`Unknown connection type: ${config.connectionType}`);
        }
    }

    /**
     * Get client by environment ID
     */
    getClient(environmentId: string): Docker {
        const client = this.clients.get(environmentId);
        if (!client) {
            throw new Error(
                `Environment not found: ${environmentId}. The environment may not be configured or the Docker daemon may be unreachable.`,
            );
        }
        return client;
    }

    /**
     * Check if environment exists
     */
    hasEnvironment(environmentId: string): boolean {
        return this.clients.has(environmentId);
    }

    /**
     * Get client safely (returns null if not found)
     */
    getClientSafe(environmentId: string): Docker | null {
        return this.clients.get(environmentId) || null;
    }

    /**
     * Get default client
     */
    getDefaultClient(): Docker {
        if (!this.defaultEnvironmentId) {
            // Ultimate fallback to legacy singleton
            logger.debug('No default environment configured, using legacy default client');
            return defaultDocker;
        }
        return this.getClient(this.defaultEnvironmentId);
    }

    /**
     * Get default environment ID
     */
    getDefaultEnvironmentId(): string | null {
        return this.defaultEnvironmentId;
    }

    /**
     * Remove environment
     */
    async unregisterEnvironment(environmentId: string): Promise<void> {
        this.stopHealthCheck(environmentId);
        this.clients.delete(environmentId);
        logger.info({ environmentId }, 'Environment unregistered');
    }

    /**
     * Health check for environment
     */
    private startHealthCheck(environmentId: string): void {
        // Stagger health checks to avoid thundering herd
        const offset = Math.random() * 10000;

        setTimeout(() => {
            const interval = setInterval(async () => {
                try {
                    const client = this.clients.get(environmentId);
                    if (client) {
                        await client.ping();
                        // TODO: Update health status in DB via service
                    }
                } catch (err) {
                    logger.error({ err, environmentId }, 'Health check failed for environment');
                }
            }, 30000); // Every 30 seconds

            this.healthCheckIntervals.set(environmentId, interval);
        }, offset);
    }

    private stopHealthCheck(environmentId: string): void {
        const interval = this.healthCheckIntervals.get(environmentId);
        if (interval) {
            clearInterval(interval);
            this.healthCheckIntervals.delete(environmentId);
        }
    }

    /**
     * Get all registered environment IDs
     */
    getEnvironmentIds(): string[] {
        return Array.from(this.clients.keys());
    }

    /**
     * Reload environment from DB (for hot-reload of config changes)
     */
    async reloadEnvironment(config: EnvironmentConfig): Promise<void> {
        await this.unregisterEnvironment(config.id);
        await this.registerEnvironment(config);
    }

    /**
     * Cleanup all clients
     */
    async shutdown(): Promise<void> {
        logger.info('Shutting down Docker client registry');

        for (const environmentId of this.clients.keys()) {
            this.stopHealthCheck(environmentId);
        }

        this.clients.clear();
    }

    /**
     * Decrypt encrypted values using encryption service
     * Note: This requires the encryption service to be shared or available
     */
    private decryptValue(encryptedValue: string): string {
        // TODO: Import and use the encryption service from nexploy
        // For now, return as-is (will be implemented when integrating with nexploy)
        logger.warn('TLS credential decryption not yet implemented');
        return encryptedValue;
    }
}

export const dockerClientRegistry = new DockerClientRegistry();
