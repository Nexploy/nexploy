import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import byline from 'byline';
import { docker } from '@/utils/dockerClient';

export interface BaseSingleResourceStateManagerConfig {
    resourceType: string;
    resourceId: string;
    pollIntervalMs?: number;
    maxReconnectAttempts?: number;
    maxListeners?: number;
}

export abstract class BaseSingleResourceStateManager<TState> extends EventEmitter {
    protected readonly resourceType: string;
    protected readonly resourceId: string;
    protected currentState: TState | null = null;
    protected monitoring: boolean = false;
    protected pollInterval: NodeJS.Timeout | null = null;
    protected readonly POLL_INTERVAL_MS: number;
    protected dockerEventStream: any = null;
    protected reconnectAttempts = 0;
    protected readonly MAX_RECONNECT_ATTEMPTS: number;

    protected constructor(config: BaseSingleResourceStateManagerConfig) {
        super();
        this.resourceType = config.resourceType;
        this.resourceId = config.resourceId;
        this.POLL_INTERVAL_MS = config.pollIntervalMs ?? 5000;
        this.MAX_RECONNECT_ATTEMPTS = config.maxReconnectAttempts ?? 5;
        this.setMaxListeners(config.maxListeners ?? 50);
        this.setupDockerStatusListeners();
    }

    private setupDockerStatusListeners() {
        dockerStatusManager.on('status-changed', async (event: DockerStatusEvent) => {
            if (this.monitoring && event.status === 'connected') {
                logger.info(
                    { resourceId: this.resourceId },
                    `Docker reconnected, reinitializing ${this.resourceType} monitor`,
                );
                try {
                    await this.loadInitialState();
                    await this.startDockerEventsListener();
                    this.reconnectAttempts = 0;
                } catch (err) {
                    logger.error(
                        { err, resourceId: this.resourceId },
                        `Failed to reinitialize ${this.resourceType} after Docker reconnection`,
                    );
                }
            } else if (this.monitoring && event.status === 'disconnected') {
                logger.warn(
                    { resourceId: this.resourceId },
                    `Docker disconnected, stopping ${this.resourceType} event stream`,
                );
                this.cleanupEventStream();
            }
        });
    }

    async start(): Promise<void> {
        if (this.monitoring) {
            logger.warn(
                { resourceId: this.resourceId },
                `${this.resourceType} monitor already running`,
            );
            return;
        }

        this.monitoring = true;
        logger.info({ resourceId: this.resourceId }, `Starting ${this.resourceType} monitor`);

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
                    { err, resourceId: this.resourceId },
                    `Failed to initialize ${this.resourceType}, falling back to polling`,
                );
            }
        } else {
            logger.warn(
                { resourceId: this.resourceId, status },
                `Docker unavailable — using polling only`,
            );
        }

        this.startPolling();
    }

    async stop(): Promise<void> {
        this.monitoring = false;
        logger.info({ resourceId: this.resourceId }, `Stopping ${this.resourceType} monitor`);

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        this.cleanupEventStream();
        this.currentState = null;
        this.removeAllListeners();
    }

    protected cleanupEventStream() {
        if (this.dockerEventStream) {
            try {
                this.dockerEventStream.destroy();
            } catch (err) {
                logger.error(
                    { err, resourceId: this.resourceId },
                    `Error destroying ${this.resourceType} event stream`,
                );
            }
            this.dockerEventStream = null;
        }
    }

    private async loadInitialState(): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.warn(
                { resourceId: this.resourceId },
                `Cannot load initial state: Docker not connected`,
            );
            return;
        }

        try {
            const state = await this.fetchResourceState();
            this.currentState = state;

            logger.info(
                { resourceId: this.resourceId },
                `Initial ${this.resourceType} state loaded`,
            );

            this.emitInitialState(state);
        } catch (err: any) {
            if (err.statusCode === 404) {
                logger.warn(
                    { resourceId: this.resourceId },
                    `${this.resourceType} not found during initialization`,
                );
            } else {
                logger.error(
                    { err, resourceId: this.resourceId },
                    `Error loading initial ${this.resourceType} state`,
                );
                throw err;
            }
        }
    }

    private async startDockerEventsListener(): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.warn(
                { resourceId: this.resourceId },
                `Cannot start events listener: Docker not connected`,
            );
            return;
        }

        try {
            const filters = this.getEventFilters();
            const stream = await docker.getEvents({ filters });

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
                    logger.error(
                        { err, raw: str, resourceId: this.resourceId },
                        `Error parsing Docker event for ${this.resourceType}`,
                    );
                }
            });

            lineStream.on('error', (err: Error) => {
                logger.error(
                    { err, resourceId: this.resourceId },
                    `Docker ${this.resourceType} events stream error`,
                );
                this.handleStreamError();
            });

            lineStream.on('end', () => {
                logger.warn(
                    { resourceId: this.resourceId },
                    `Docker ${this.resourceType} events stream ended`,
                );
                this.handleStreamError();
            });

            logger.info(
                { resourceId: this.resourceId },
                `Docker ${this.resourceType} events listener started`,
            );
        } catch (err) {
            logger.error(
                { err, resourceId: this.resourceId },
                `Error starting Docker ${this.resourceType} events listener`,
            );
            await this.handleStreamError();
        }
    }

    protected async handleStreamError(): Promise<void> {
        if (!this.monitoring) return;

        this.dockerEventStream = null;
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
            logger.error(
                { resourceId: this.resourceId },
                `Max reconnection attempts reached for ${this.resourceType}, relying on polling only`,
            );
            return;
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        logger.info(
            { backoffDelay, attempt: this.reconnectAttempts, resourceId: this.resourceId },
            `Reconnecting ${this.resourceType} to Docker events`,
        );

        setTimeout(() => {
            if (this.monitoring && dockerStatusManager.isConnected()) {
                this.startDockerEventsListener();
            } else {
                logger.warn(
                    { resourceId: this.resourceId },
                    `Skipping ${this.resourceType} event listener reconnection: Docker not connected`,
                );
            }
        }, backoffDelay);
    }

    private startPolling(): void {
        this.pollResourceState().catch((err) => {
            logger.error({ err }, `Error in ${this.resourceType} polling`);
        });

        this.pollInterval = setInterval(async () => {
            if (!this.monitoring) return;

            if (!dockerStatusManager.isConnected()) {
                logger.debug(
                    { resourceId: this.resourceId },
                    `Skipping ${this.resourceType} poll: Docker not connected`,
                );
                return;
            }

            try {
                await this.pollResourceState();
            } catch (err) {
                logger.error(
                    { err, resourceId: this.resourceId },
                    `Error in ${this.resourceType} polling`,
                );
            }
        }, this.POLL_INTERVAL_MS);

        logger.info(
            { interval: this.POLL_INTERVAL_MS, resourceId: this.resourceId },
            `${this.resourceType} polling started`,
        );
    }

    private async pollResourceState(): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.debug(
                { resourceId: this.resourceId },
                `Skipping ${this.resourceType} poll: Docker not connected`,
            );
            return;
        }

        try {
            const newState = await this.fetchResourceState();
            const oldState = this.currentState;
            this.currentState = newState;

            if (oldState && this.hasStateChanged(oldState, newState)) {
                this.emitStateChange(newState, oldState);
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.currentState;
                this.currentState = null;

                if (oldState) {
                    this.emitRemoved(oldState);
                }
            }
        }
    }

    async handleDockerEvent(event: any): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.debug(
                { resourceId: this.resourceId },
                `Ignoring Docker event: Docker not connected`,
            );
            return;
        }

        const action = event.Action;
        logger.debug({ resourceId: this.resourceId, action }, 'Docker event received');

        if (this.shouldHandleEvent(action)) {
            await this.updateResourceState(action);
        }
    }

    protected async updateResourceState(action: string): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.debug(
                { resourceId: this.resourceId },
                `Skipping ${this.resourceType} state update: Docker not connected`,
            );
            return;
        }

        try {
            if (this.isDestroyAction(action)) {
                const oldState = this.currentState;
                this.currentState = null;

                if (oldState) {
                    this.emitRemoved(oldState);
                }
                return;
            }

            const newState = await this.fetchResourceState();
            const oldState = this.currentState;
            this.currentState = newState;

            if (oldState && this.hasStateChanged(oldState, newState)) {
                this.emitStateChange(newState, oldState);
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.currentState;
                this.currentState = null;

                if (oldState) {
                    this.emitRemoved(oldState);
                }
            } else {
                logger.error(
                    { err, resourceId: this.resourceId },
                    `Error updating ${this.resourceType} state`,
                );
            }
        }
    }

    getCurrentState(): TState | null {
        return this.currentState;
    }

    getResourceId(): string {
        return this.resourceId;
    }

    isMonitoring(): boolean {
        return this.monitoring;
    }

    getStats() {
        return {
            resourceId: this.resourceId,
            monitoring: this.monitoring,
            hasState: this.currentState !== null,
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            dockerConnected: dockerStatusManager.isConnected(),
            ...this.getCustomStats(),
        };
    }

    async refresh(): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.warn(
                { resourceId: this.resourceId },
                `Cannot refresh ${this.resourceType}: Docker not connected`,
            );
            throw new Error('Docker is not connected');
        }

        logger.info({ resourceId: this.resourceId }, `Refreshing ${this.resourceType} state`);

        try {
            const newState = await this.fetchResourceState();
            const oldState = this.currentState;
            this.currentState = newState;

            if (oldState && this.hasStateChanged(oldState, newState)) {
                this.emitStateChange(newState, oldState);
            }

            logger.info({ resourceId: this.resourceId }, `${this.resourceType} state refreshed`);
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.currentState;
                this.currentState = null;

                if (oldState) {
                    this.emitRemoved(oldState);
                }
            } else {
                logger.error(
                    { err, resourceId: this.resourceId },
                    `Error during ${this.resourceType} refresh`,
                );
                throw err;
            }
        }
    }

    abstract fetchResourceState(): Promise<TState>;
    abstract getEventFilters(): Record<string, string[]>;
    abstract shouldHandleEvent(action: string): boolean;
    abstract isDestroyAction(action: string): boolean;
    abstract hasStateChanged(oldState: TState, newState: TState): boolean;
    abstract emitInitialState(state: TState): void;
    abstract emitStateChange(newState: TState, oldState: TState): void;
    abstract emitRemoved(oldState: TState): void;
    protected abstract getCustomStats(): Record<string, any>;
}
