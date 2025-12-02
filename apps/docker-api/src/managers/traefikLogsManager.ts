import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { EventEmitter } from 'events';
import { TraefikRequest } from '@workspace/typescript-interface/traefik/traefik.request';

const TRAEFIK_CONTAINER_NAME = 'nexploy_traefik_dev';
const MAX_REQUESTS = 500;

class TraefikLogsManager extends EventEmitter {
    private requests: TraefikRequest[] = [];
    private isRunning = false;

    constructor() {
        super();
        this.setMaxListeners(100);
    }

    async start(): Promise<void> {
        if (this.isRunning) return;

        try {
            const container = docker.getContainer(TRAEFIK_CONTAINER_NAME);
            await container.inspect();

            this.isRunning = true;
            await this.streamLogs();
            logger.info('Traefik logs manager started');
        } catch (err) {
            logger.warn('Traefik container not found, manager not started');
        }
    }

    async stop(): Promise<void> {
        this.isRunning = false;
        this.requests = [];
        logger.info('Traefik logs manager stopped');
    }

    private async streamLogs(): Promise<void> {
        if (!this.isRunning) return;

        try {
            const container = docker.getContainer(TRAEFIK_CONTAINER_NAME);

            const stream = await container.logs({
                follow: true,
                stdout: true,
                stderr: true,
                tail: 100,
                timestamps: false,
            });

            let buffer = '';

            stream.on('data', (chunk: Buffer) => {
                const data = chunk.toString('utf8');
                buffer += data;

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    this.parseLine(line);
                }
            });

            stream.on('error', (err) => {
                logger.error({ err }, 'Traefik log stream error');
                this.reconnect();
            });

            stream.on('end', () => {
                logger.info('Traefik log stream ended');
                this.reconnect();
            });
        } catch (err) {
            logger.error({ err }, 'Failed to stream Traefik logs');
            this.reconnect();
        }
    }

    private reconnect(): void {
        if (!this.isRunning) return;

        setTimeout(() => {
            logger.info('Reconnecting to Traefik logs...');
            this.streamLogs();
        }, 5000);
    }

    private parseLine(line: string): void {
        const cleanLine = this.stripDockerHeader(line);
        if (!cleanLine) return;

        try {
            const log = JSON.parse(cleanLine);

            if (!log.RequestMethod || !log.RequestPath) return;

            const request: TraefikRequest = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                timestamp: log.time || log.StartUTC || new Date().toISOString(),
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
        this.requests.unshift(request);

        if (this.requests.length > MAX_REQUESTS) {
            this.requests = this.requests.slice(0, MAX_REQUESTS);
        }

        this.emit('request', { type: 'request', request, timestamp: Date.now() });
    }

    getRequests(): TraefikRequest[] {
        return this.requests;
    }

    clearRequests(): void {
        this.requests = [];
        this.emit('clear', { type: 'initial', requests: [], timestamp: Date.now() });
    }
}

export const traefikLogsManager = new TraefikLogsManager();
