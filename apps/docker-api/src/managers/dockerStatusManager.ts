import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { logger } from '@/utils/logger';
import {
    DockerStatus,
    DockerStatusEvent,
} from '@workspace/typescript-interface/docker/docker.status';
import { BaseMonitor } from '@/lib/BaseMonitor';

export class DockerStatusManager extends BaseMonitor {
    private status: DockerStatus = 'disconnected';
    private readonly environmentId: string;

    constructor(environmentId: string) {
        super({
            monitorName: `Docker Status Manager [${environmentId}]`,
            checkIntervalMs: 5000,
            maxListeners: 100,
        });
        this.environmentId = environmentId;
    }

    protected async performCheck(): Promise<DockerStatus> {
        try {
            const dockerClient = dockerClientRegistry.getClient(this.environmentId);
            await dockerClient.ping();
            return 'connected';
        } catch (err) {
            logger.error({ environmentId: this.environmentId }, 'Docker daemon not available');
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

    getEnvironmentId(): string {
        return this.environmentId;
    }
}

export function getDockerStatusManager(): DockerStatusManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        return stateManagerFactory.getManagers(defaultId!).dockerStatus;
    }
    return stateManagerFactory.getManagers(environmentId).dockerStatus;
}

export const dockerStatusManager = new Proxy({} as DockerStatusManager, {
    get(_target, prop) {
        const manager = getDockerStatusManager();
        const value = (manager as any)[prop];
        if (typeof value === 'function') {
            return value.bind(manager);
        }
        return value;
    },
});
