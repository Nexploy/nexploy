import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import {
    DockerStatus,
    DockerStatusEvent,
} from '@workspace/typescript-interface/docker/docker.status';

class DockerStatusManager extends EventEmitter {
    private status: DockerStatus = 'disconnected';
    private lastDockerCheck: number = 0;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private readonly HEALTH_CHECK_MS = 5000;
    private isRunning: boolean = false;

    constructor() {
        super();
        this.setMaxListeners(100);
    }

    async start() {
        if (this.isRunning) {
            logger.warn('Docker status manager already running');
            return;
        }

        this.isRunning = true;
        logger.info('Starting Docker status manager');

        this.status = 'connecting';

        const statusChangedData: DockerStatusEvent = {
            status: 'connecting',
            message: {
                text: 'Connecting...',
                level: 'loading',
            },
            timestamp: Date.now(),
        };
        this.emit('status-changed', statusChangedData);

        this.status = await this.checkDockerHealth();

        if (this.status === 'error' || this.status === 'disconnected') {
            logger.warn('Docker daemon not available');
            this.status = 'disconnected';

            const statusChangedData: DockerStatusEvent = {
                status: 'disconnected',
                message: {
                    text: 'Docker daemon is not reachable',
                    level: 'error',
                },
                timestamp: Date.now(),
            };
            this.emit('status-changed', statusChangedData);
        } else {
            logger.info('Docker daemon is available');

            const statusChangedData: DockerStatusEvent = {
                status: 'connected',
                message: {
                    text: 'Docker daemon is available',
                    level: 'success',
                },
                timestamp: Date.now(),
            };
            this.emit('status-changed', statusChangedData);
        }

        this.startHealthCheck();
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        logger.info('Stopping Docker status manager');

        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        this.status = 'disconnected';
        this.removeAllListeners();
    }

    private async checkDockerHealth(): Promise<DockerStatus> {
        try {
            await docker.ping();
            return 'connected';
        } catch (err) {
            logger.error('Docker daemon not available');
            return 'error';
        }
    }

    private startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            if (!this.isRunning) return;

            const now = Date.now();
            this.lastDockerCheck = now;

            const wasAvailable = this.status === 'connected';

            if (!wasAvailable && this.status !== 'connecting') {
                this.status = 'connecting';

                const statusChangedData: DockerStatusEvent = {
                    status: 'connecting',
                    message: {
                        text: 'Docker daemon try to reconnecting...',
                        level: 'loading',
                    },
                    timestamp: now,
                };
                this.emit('status-changed', statusChangedData);
            }

            const newStatus = await this.checkDockerHealth();

            if (this.status === newStatus) return;
            this.status = newStatus;

            if (this.status === 'connected') {
                logger.info('Docker daemon became available');

                const statusChangedData: DockerStatusEvent = {
                    status: 'connected',
                    message: {
                        text: 'Docker daemon is now available',
                        level: 'success',
                    },
                    timestamp: now,
                };
                this.emit('status-changed', statusChangedData);
            } else if (this.status === 'error' || this.status === 'disconnected') {
                logger.warn('Docker daemon became unavailable or error occurred');

                const statusChanged: DockerStatusEvent = {
                    status: this.status,
                    message: {
                        level: 'error',
                        text: 'Docker daemon is no longer reachable',
                    },
                    timestamp: now,
                };
                this.emit('status-changed', statusChanged);
            }
        }, this.HEALTH_CHECK_MS);

        logger.info({ interval: this.HEALTH_CHECK_MS }, 'Docker health check started');
    }
    getStatus(): DockerStatus {
        return this.status;
    }

    getLastCheck(): number {
        return this.lastDockerCheck;
    }

    isConnected(): boolean {
        return this.status === 'connected';
    }

    isDisconnected(): boolean {
        return this.status === 'disconnected';
    }

    getStats() {
        return {
            status: this.status,
            lastCheck: this.lastDockerCheck,
            isRunning: this.isRunning,
        };
    }
}

export const dockerStatusManager = new DockerStatusManager();
