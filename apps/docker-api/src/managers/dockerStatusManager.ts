import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import {
    DockerStatus,
    DockerStatusEvent,
} from '@workspace/typescript-interface/docker/docker.status';
import { BaseMonitor } from '@/lib/BaseMonitor';

class DockerStatusManager extends BaseMonitor {
    private status: DockerStatus = 'disconnected';

    constructor() {
        super({
            monitorName: 'Docker Status Manager',
            checkIntervalMs: 5000,
            maxListeners: 100,
        });
    }

    protected async performCheck(): Promise<DockerStatus> {
        try {
            await docker.ping();
            return 'connected';
        } catch (err) {
            logger.error('Docker daemon not available');
            return 'error';
        }
    }

    protected getCurrentStatus(): DockerStatus {
        return this.status;
    }

    protected isStatusOk(status: DockerStatus): boolean {
        return status === 'connected';
    }

    protected isStatusConnecting(status: DockerStatus): boolean {
        return status === 'connecting';
    }

    protected hasStatusChanged(oldStatus: DockerStatus, newStatus: DockerStatus): boolean {
        return oldStatus !== newStatus;
    }

    protected async handleStatusChange(status: DockerStatus, isInitial: boolean): Promise<void> {
        this.status = status;

        if (status === 'error' || status === 'disconnected') {
            logger.warn('Docker daemon not available');
            this.status = 'disconnected';

            const statusChangedData: DockerStatusEvent = {
                status: 'disconnected',
                message: {
                    text: isInitial
                        ? 'Docker daemon is not reachable'
                        : 'Docker daemon is no longer reachable',
                    level: 'error',
                },
                timestamp: Date.now(),
            };
            this.emit('status-changed', statusChangedData);
        } else if (status === 'connected') {
            logger.info(
                isInitial ? 'Docker daemon is available' : 'Docker daemon became available',
            );

            const statusChangedData: DockerStatusEvent = {
                status: 'connected',
                message: {
                    text: isInitial
                        ? 'Docker daemon is available'
                        : 'Docker daemon is now available',
                    level: 'success',
                },
                timestamp: Date.now(),
            };
            this.emit('status-changed', statusChangedData);
        }
    }

    protected async emitConnecting(): Promise<void> {
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
    }

    protected async emitReconnecting(): Promise<void> {
        this.status = 'connecting';

        const statusChangedData: DockerStatusEvent = {
            status: 'connecting',
            message: {
                text: 'Docker daemon try to reconnecting...',
                level: 'loading',
            },
            timestamp: Date.now(),
        };
        this.emit('status-changed', statusChangedData);
    }

    protected onStop(): void {
        this.status = 'disconnected';
    }

    protected getCustomStats(): Record<string, any> {
        return {
            status: this.status,
        };
    }

    getStatus(): DockerStatus {
        return this.status;
    }

    isConnected(): boolean {
        return this.status === 'connected';
    }

    isDisconnected(): boolean {
        return this.status === 'disconnected';
    }
}

export const dockerStatusManager = new DockerStatusManager();
