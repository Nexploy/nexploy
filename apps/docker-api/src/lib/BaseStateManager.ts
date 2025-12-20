import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import byline from 'byline';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import type Docker from 'dockerode';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import type { DockerStatusManager } from '@/managers/dockerStatusManager';

export interface BaseStateManagerConfig {
    managerName: string;
    environmentId: string;
    pollIntervalMs?: number;
    maxReconnectAttempts?: number;
    maxListeners?: number;
}

export abstract class BaseStateManager extends EventEmitter {
    protected readonly managerName: string;
    protected readonly environmentId: string;
    protected readonly docker: Docker;
    protected polling: boolean = false;
    protected pollInterval: NodeJS.Timeout | null = null;
    protected readonly POLL_INTERVAL_MS: number;
    protected dockerEventStream: any = null;
    protected reconnectAttempts = 0;
    protected readonly MAX_RECONNECT_ATTEMPTS: number;

    protected constructor(config: BaseStateManagerConfig) {
        super();
        this.managerName = config.managerName;
        this.environmentId = config.environmentId;
        this.docker = dockerClientRegistry.getClient(config.environmentId);
        this.POLL_INTERVAL_MS = config.pollIntervalMs ?? 10000;
        this.MAX_RECONNECT_ATTEMPTS = config.maxReconnectAttempts ?? 5;
        this.setMaxListeners(config.maxListeners ?? 100);
        // Defer setupDockerStatusListeners to avoid circular dependency during initialization
        setImmediate(() => this.setupDockerStatusListeners());
    }

    protected getDockerStatusManager(): DockerStatusManager {
        const managers = stateManagerFactory.getManagersSafe(this.environmentId);
        if (!managers) {
            throw new Error(
                `No managers found for environment: ${this.environmentId}. The environment may not be initialized.`,
            );
        }
        if (!managers.dockerStatus) {
            throw new Error(
                `DockerStatusManager not found for environment: ${this.environmentId}. The manager may not be fully initialized yet.`,
            );
        }
        return managers.dockerStatus;
    }

    private setupDockerStatusListeners() {
        try {
            const dockerStatusManager = this.getDockerStatusManager();

            dockerStatusManager.on('status-changed', async (event: DockerStatusEvent) => {
                if (this.polling && event.status === 'connected') {
                    logger.info(`Docker reconnected, reinitializing ${this.managerName}`);
                    try {
                        await this.loadInitialState();
                        await this.startDockerEventsListener();
                        this.reconnectAttempts = 0;
                    } catch (err) {
                        logger.error(
                            { err },
                            `Failed to reinitialize ${this.managerName} after Docker reconnection`,
                        );
                    }
                } else if (this.polling && event.status === 'disconnected') {
                    logger.warn(`Docker disconnected, stopping ${this.managerName} event stream`);
                    this.cleanupEventStream();
                }
            });
        } catch (err) {
            logger.error(
                { err, environmentId: this.environmentId, managerName: this.managerName },
                'Failed to setup docker status listeners',
            );
        }
    }

    async start(): Promise<void> {
        if (this.polling) {
            logger.warn(`${this.managerName} already running`);
            return;
        }

        this.polling = true;
        logger.info(`Starting ${this.managerName}`);

        const dockerStatusManager = this.getDockerStatusManager();
        const status = dockerStatusManager.getStatus();

        if (status === 'connecting') {
            await new Promise<void>((resolve) => {
                dockerStatusManager.once('status-changed', ({ status }) => {
                    if (status !== 'connecting') resolve();
                });
            });
        }

        if (dockerStatusManager.isConnected()) {
            try {
                await this.loadInitialState();
                await this.startDockerEventsListener();
            } catch (err) {
                logger.error(
                    { err },
                    `Failed to initialize ${this.managerName}, falling back to polling`,
                );
            }
        } else {
            logger.warn(`Docker unavailable (status: ${status}) — using polling only`);
        }

        this.startFallbackPolling();
    }

    async stop(): Promise<void> {
        this.polling = false;
        logger.info(`Stopping ${this.managerName}`);

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        this.cleanupEventStream();
        this.onStop();
        this.removeAllListeners();
    }

    protected cleanupEventStream() {
        if (this.dockerEventStream) {
            try {
                this.dockerEventStream.destroy();
            } catch (err) {
                logger.error({ err }, `Error destroying ${this.managerName} event stream`);
            }
            this.dockerEventStream = null;
        }
    }

    private async startDockerEventsListener(): Promise<void> {
        const dockerStatusManager = this.getDockerStatusManager();
        if (!dockerStatusManager.isConnected()) {
            logger.warn(`Cannot start events listener: Docker is not connected`);
            return;
        }

        try {
            const filters = this.getEventFilters();
            const stream = await this.docker.getEvents({ filters });

            this.dockerEventStream = stream;
            this.reconnectAttempts = 0;

            const lineStream = byline.createStream(stream);

            lineStream.on('data', async (line: Buffer) => {
                const str = line.toString().trim();
                if (!str) return;

                try {
                    const event = JSON.parse(str);
                    await this.handleDockerEvent(event);
                } catch (err) {
                    logger.error({ err, raw: str }, 'Error parsing Docker event');
                }
            });

            lineStream.on('error', (err: Error) => {
                logger.error({ err }, `${this.managerName} events stream error`);
                this.handleStreamError();
            });

            lineStream.on('end', () => {
                logger.warn(`${this.managerName} events stream ended`);
                this.handleStreamError();
            });

            logger.info(`${this.managerName} events listener started`);
        } catch (err) {
            logger.error({ err }, `Error starting ${this.managerName} events listener`);
            await this.handleStreamError();
        }
    }

    protected async handleStreamError(): Promise<void> {
        if (!this.polling) return;

        this.dockerEventStream = null;
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
            logger.error(`Max reconnection attempts reached for ${this.managerName}`);
            return;
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        logger.info(
            { backoffDelay, attempt: this.reconnectAttempts },
            `Reconnecting ${this.managerName} to Docker events`,
        );

        setTimeout(() => {
            try {
                const dockerStatusManager = this.getDockerStatusManager();
                if (this.polling && dockerStatusManager.isConnected()) {
                    this.startDockerEventsListener();
                } else {
                    logger.warn(
                        `Skipping ${this.managerName} event listener reconnection: Docker not connected`,
                    );
                }
            } catch (err) {
                logger.error(
                    { err },
                    `Failed to reconnect ${this.managerName} event listener: Docker status manager not available`,
                );
            }
        }, backoffDelay);
    }

    private startFallbackPolling(): void {
        this.pollInterval = setInterval(async () => {
            if (!this.polling) return;

            try {
                const dockerStatusManager = this.getDockerStatusManager();
                if (!dockerStatusManager.isConnected()) {
                    // logger.debug(`Skipping ${this.managerName} poll: Docker not connected`);
                    return;
                }

                await this.fullStateSync();
            } catch (err) {
                logger.error({ err }, `Error in ${this.managerName} fallback polling`);
            }
        }, this.POLL_INTERVAL_MS);

        logger.info(
            { interval: this.POLL_INTERVAL_MS },
            `${this.managerName} fallback polling started`,
        );
    }

    getStats() {
        let dockerConnected = false;
        try {
            const dockerStatusManager = this.getDockerStatusManager();
            dockerConnected = dockerStatusManager.isConnected();
        } catch (err) {
            // DockerStatusManager may not be available during initialization
            dockerConnected = false;
        }

        return {
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            polling: this.polling,
            dockerConnected,
            ...this.getCustomStats(),
        };
    }

    abstract loadInitialState(): Promise<void>;
    abstract handleDockerEvent(event: any): Promise<void>;
    abstract fullStateSync(): Promise<void>;
    abstract getEventFilters(): Record<string, string[]>;
    protected abstract onStop(): void;
    protected abstract getCustomStats(): Record<string, any>;
}
