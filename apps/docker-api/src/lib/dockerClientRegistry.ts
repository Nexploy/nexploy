import Docker from 'dockerode';
import { logger } from '@/utils/logger';
import { defaultDocker } from '@/utils/dockerClient';
import { EnvironmentSchemaType } from '@workspace/schemas-zod/docker/environment/environment.schema';
import { EnvironmentConfig } from '@workspace/typescript-interface/docker/environment/environment';

class DockerClientRegistry {
    private clients: Map<string, Docker> = new Map();
    private configs: Map<string, EnvironmentConfig> = new Map();
    private defaultEnvironmentId: string | null = null;
    private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

    async initialize(environments: EnvironmentConfig[]): Promise<string[]> {
        logger.info({ count: environments.length }, 'Initializing Docker client registry');

        let successCount = 0;
        let failCount = 0;
        const registeredEnvironmentIds: string[] = [];

        for (const config of environments) {
            try {
                await this.registerEnvironment(config);

                if (config.isDefault) {
                    this.defaultEnvironmentId = config.id;
                }
                registeredEnvironmentIds.push(config.id!);
                successCount++;
            } catch (err) {
                logger.error(
                    { err, environmentId: config.id, name: config.name },
                    'Failed to register environment',
                );
                failCount++;
            }
        }

        logger.info(
            { total: environments.length, succeeded: successCount, failed: failCount },
            'Docker client registry initialization complete',
        );

        if (!this.defaultEnvironmentId && environments.length > 0) {
            const firstRegistered = environments.find((env) => this.clients.has(env.id));
            if (firstRegistered) {
                this.defaultEnvironmentId = firstRegistered.id;
                logger.warn(
                    { environmentId: firstRegistered.id, name: firstRegistered.name },
                    'No default environment found, using first available environment',
                );
            }
        }

        if (this.defaultEnvironmentId && !this.clients.has(this.defaultEnvironmentId)) {
            this.clients.set(this.defaultEnvironmentId, defaultDocker);
        }

        if (this.clients.size === 0) {
            logger.warn(
                'No Docker environments could be registered. Service will start but Docker operations will fail until environments are configured.',
            );
        }

        return registeredEnvironmentIds;
    }

    async registerEnvironment(config: EnvironmentSchemaType): Promise<Docker> {
        const client = this.createClient(config);

        try {
            await Promise.race([
                client.ping(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Ping timeout after 5s')), 5000),
                ),
            ]);

            logger.info({ environmentId: config.id, name: config.name }, 'Environment connected');

            this.clients.set(config.id!, client);
            this.configs.set(config.id!, config as EnvironmentConfig);
            this.startHealthCheck(config.id!);

            return client;
        } catch (err) {
            logger.error(
                { err, environmentId: config.id, name: config.name },
                'Environment connection failed - NOT registering this environment',
            );
            throw new Error(
                `Failed to connect to environment "${config.name}" (${config.id}): Docker daemon unreachable`,
            );
        }
    }

    private createClient(config: EnvironmentSchemaType): Docker {
        switch (config.connectionType) {
            case 'UNIX_SOCKET':
                return new Docker({ socketPath: config.socketPath });
            case 'TCP':
                return new Docker({
                    host: config.host,
                    port: config.port,
                });
            case 'TCP_TLS':
                return new Docker({
                    host: config.host,
                    port: config.port,
                    ca: config.tlsCa,
                    cert: config.tlsCert,
                    key: config.tlsKey,
                });
            default:
                throw new Error(`Unknown connection type: ${config.connectionType}`);
        }
    }

    getClient(environmentId: string): Docker {
        const client = this.clients.get(environmentId);
        if (!client) {
            throw new Error(
                `Environment not found: ${environmentId}. The environment may not be configured or the Docker daemon may be unreachable.`,
            );
        }
        return client;
    }

    hasEnvironment(environmentId: string): boolean {
        return this.clients.has(environmentId);
    }

    getClientSafe(environmentId: string): Docker | null {
        return this.clients.get(environmentId) || null;
    }

    getDefaultClient(): Docker {
        if (!this.defaultEnvironmentId) {
            logger.debug('No default environment configured, using legacy default client');
            return defaultDocker;
        }
        return this.getClient(this.defaultEnvironmentId);
    }

    getDefaultEnvironmentId(): string | null {
        return this.defaultEnvironmentId;
    }

    async unregisterEnvironment(environmentId: string): Promise<void> {
        this.stopHealthCheck(environmentId);
        this.clients.delete(environmentId);
        this.configs.delete(environmentId);
        logger.info({ environmentId }, 'Environment unregistered');
    }

    getEnvironmentConfig(environmentId: string): EnvironmentConfig | null {
        return this.configs.get(environmentId) || null;
    }

    getDefaultEnvironmentConfig(): EnvironmentConfig | null {
        if (!this.defaultEnvironmentId) {
            return null;
        }
        return this.configs.get(this.defaultEnvironmentId) || null;
    }

    private startHealthCheck(environmentId: string): void {
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
            }, 30000);

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

    getEnvironmentIds(): string[] {
        return Array.from(this.clients.keys());
    }

    async reloadEnvironment(config: EnvironmentSchemaType): Promise<void> {
        await this.unregisterEnvironment(config.id!);
        await this.registerEnvironment(config);
    }

    async shutdown(): Promise<void> {
        logger.info('Shutting down Docker client registry');

        for (const environmentId of this.clients.keys()) {
            this.stopHealthCheck(environmentId);
        }

        this.clients.clear();
        this.configs.clear();
    }
}

export const dockerClientRegistry = new DockerClientRegistry();
