import { logger } from '@/utils/logger';
import dayjs from 'dayjs';
import { TraefikRequest } from '@workspace/typescript-interface/traefik/traefik.request';
import { BaseStateManager } from '@/lib/base/BaseStateManager';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { TRAEFIK_CONTAINER_NAME } from '@/lib/config';

const MAX_REQUESTS = 500;

interface TraefikLogEvent {
    type: 'request' | 'clear';
    request?: TraefikRequest;
    requests?: TraefikRequest[];
    timestamp: number;
}

export class TraefikLogsManager extends BaseStateManager {
    private requests: TraefikRequest[] = [];
    private logStream: NodeJS.ReadableStream | null = null;
    private logBuffer = '';
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isReconnecting = false;
    private traefikExists = false;

    constructor(environmentId: string) {
        super({
            managerName: `Traefik Logs Manager [${environmentId}]`,
            environmentId,
            pollIntervalMs: 0,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
    }

    private async checkTraefikExists(): Promise<boolean> {
        try {
            const container = this.docker.getContainer(TRAEFIK_CONTAINER_NAME);
            await container.inspect();
            return true;
        } catch (err) {
            return false;
        }
    }

    getEventFilters(): Record<string, string[]> {
        return {
            type: ['container'],
            event: ['start', 'stop', 'die', 'kill', 'restart'],
            container: [TRAEFIK_CONTAINER_NAME],
        };
    }

    async loadInitialState(): Promise<void> {
        this.traefikExists = await this.checkTraefikExists();

        if (!this.traefikExists) {
            logger.info(
                { environmentId: this.environmentId },
                'Traefik container not found in this environment, skipping log stream',
            );
            return;
        }

        try {
            await this.startLogStream();
            logger.info('Traefik logs manager initial state loaded');
        } catch (err) {
            logger.error({ err }, 'Failed to start Traefik log stream');
        }
    }

    async handleDockerEvent(event: any): Promise<void> {
        if (event.Type === 'container' && event.Actor.Attributes?.name === TRAEFIK_CONTAINER_NAME) {
            logger.debug(
                {
                    action: event.Action,
                    containerId: event.Actor.ID,
                },
                'Traefik container event received',
            );

            switch (event.Action) {
                case 'start':
                case 'restart':
                    await this.reconnectLogStream();
                    break;
                case 'stop':
                case 'die':
                case 'kill':
                    this.stopLogStream();
                    break;
            }
        }
    }

    async fullStateSync(): Promise<void> {
        if (!this.traefikExists) {
            this.traefikExists = await this.checkTraefikExists();
            if (!this.traefikExists) {
                return;
            }
        }

        if (!this.logStream && !this.isReconnecting) {
            await this.reconnectLogStream();
        }
    }

    private async startLogStream(): Promise<void> {
        if (this.logStream || this.isReconnecting) {
            logger.debug('Log stream already active or reconnecting, skipping start');
            return;
        }

        const exists = await this.checkTraefikExists();
        if (!exists) {
            logger.debug('Traefik container not found, cannot start log stream');
            this.traefikExists = false;
            return;
        }

        this.isReconnecting = true;

        try {
            const container = this.docker.getContainer(TRAEFIK_CONTAINER_NAME);

            const stream = await container.logs({
                follow: true,
                stdout: true,
                stderr: true,
                tail: 0,
                timestamps: false,
            });

            this.logStream = stream;
            this.logBuffer = '';
            this.isReconnecting = false;
            this.traefikExists = true;

            stream.on('data', (chunk: Buffer) => {
                this.handleLogData(chunk);
            });

            stream.on('error', (err) => {
                logger.error({ err }, 'Traefik log stream error');
                this.logStream = null;
                if (this.polling) {
                    this.scheduleReconnect();
                }
            });

            stream.on('end', () => {
                logger.info('Traefik log stream ended');
                this.logStream = null;
                if (this.polling) {
                    this.scheduleReconnect();
                }
            });

            logger.info('Traefik log stream started');
        } catch (err) {
            this.isReconnecting = false;

            if ((err as any).statusCode !== 404) {
                logger.error({ err }, 'Failed to start Traefik log stream');
            }
        }
    }

    private stopLogStream(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.logStream) {
            try {
                (this.logStream as any).destroy?.();
            } catch (err) {
                logger.error({ err }, 'Error stopping log stream');
            }
            this.logStream = null;
            this.logBuffer = '';
        }

        this.isReconnecting = false;
    }

    private async reconnectLogStream(): Promise<void> {
        if (this.isReconnecting) {
            logger.debug('Already reconnecting, skipping');
            return;
        }

        this.stopLogStream();
        await this.startLogStream();
    }

    private scheduleReconnect(): void {
        if (!this.polling || this.reconnectTimeout || this.isReconnecting) {
            return;
        }

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            logger.debug('Attempting to reconnect to Traefik logs...');
            this.reconnectLogStream().catch((err) => {
                if ((err as any).statusCode !== 404) {
                    logger.error({ err }, 'Failed to reconnect log stream');
                }
            });
        }, 5000);
    }

    private handleLogData(chunk: Buffer): void {
        const data = chunk.toString('utf8');
        this.logBuffer += data;

        const lines = this.logBuffer.split('\n');
        this.logBuffer = lines.pop() || '';

        for (const line of lines) {
            this.parseLine(line);
        }
    }

    private parseLine(line: string): void {
        const cleanLine = this.stripDockerHeader(line);
        if (!cleanLine) return;

        try {
            const log = JSON.parse(cleanLine);

            if (!log.RequestMethod || !log.RequestPath) return;

            const request: TraefikRequest = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                timestamp: log.time || log.StartUTC || dayjs().toISOString(),
                clientAddr: log.ClientAddr || '',
                clientHost: log.ClientHost || '',
                method: log.RequestMethod || '',
                path: log.RequestPath || '',
                protocol: log.RequestProtocol || '',
                status: log.DownstreamStatus || log.OriginStatus || 0,
                duration: this.parseDuration(log.Duration),
                size: log.DownstreamContentSize || log.OriginContentSize || 0,
                routerName: log.RouterName,
                serviceName: log.ServiceName,
                requestHost: log.RequestHost,
                userAgent: log.request_User_Agent || log['request_User-Agent'],
            };

            this.addRequest(request);
        } catch {}
    }

    private stripDockerHeader(line: string): string {
        if (line.length > 8) {
            const header = line.charCodeAt(0);
            if (header === 1 || header === 2) {
                return line.slice(8);
            }
        }
        return line;
    }

    private parseDuration(duration: any): number {
        if (typeof duration === 'number') return Math.round(duration / 1000000);
        if (typeof duration === 'string') {
            const match = duration.match(/^([\d.]+)(ms|s|µs|ns)?$/);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2] || 'ns';
                switch (unit) {
                    case 's':
                        return Math.round(value * 1000);
                    case 'ms':
                        return Math.round(value);
                    case 'µs':
                        return Math.round(value / 1000);
                    default:
                        return Math.round(value / 1000000);
                }
            }
        }
        return 0;
    }

    private addRequest(request: TraefikRequest): void {
        this.requests.push(request);

        if (this.requests.length > MAX_REQUESTS) {
            this.requests.shift();
        }

        const event: TraefikLogEvent = {
            type: 'request',
            request,
            timestamp: Date.now(),
        };

        this.emit('request', event);
    }

    protected onStop(): void {
        this.stopLogStream();
        this.requests = [];
        this.logBuffer = '';
        logger.info('Traefik logs manager stopped and cleaned up');
    }

    protected getCustomStats(): Record<string, any> {
        return {
            requestsInMemory: this.requests.length,
            logStreamActive: this.logStream !== null,
            bufferSize: this.logBuffer.length,
            isReconnecting: this.isReconnecting,
        };
    }

    getRequests(): TraefikRequest[] {
        return [...this.requests].reverse();
    }

    getRecentRequests(count: number): TraefikRequest[] {
        return this.requests.slice(-count).reverse();
    }

    clearRequests(): void {
        this.requests = [];

        const event: TraefikLogEvent = {
            type: 'clear',
            requests: [],
            timestamp: Date.now(),
        };

        this.emit('clear', event);
        logger.info('Traefik requests cleared from memory');
    }

    getRequestStats() {
        return {
            totalRequests: this.requests.length,
            logStreamActive: this.logStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            listening: this.polling,
            isReconnecting: this.isReconnecting,
        };
    }
}

export function getTraefikLogsManager(): TraefikLogsManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (!defaultId) {
            throw new Error('No Docker environment available');
        }
        return stateManagerFactory.getManagers(defaultId).traefik;
    }
    return stateManagerFactory.getManagers(environmentId).traefik;
}

export const traefikLogsManager = new Proxy({} as TraefikLogsManager, {
    get(_target, prop) {
        const manager = getTraefikLogsManager();
        const value = (manager as any)[prop];
        if (typeof value === 'function') {
            return value.bind(manager);
        }
        return value;
    },
});
