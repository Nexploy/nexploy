import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import dayjs from 'dayjs';
import type Docker from 'dockerode';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { Readable } from 'stream';
import {
    ContainerLogsEvent,
    LogEntry,
} from '@workspace/typescript-interface/docker/docker.container.logs';

export class ContainerLogsStateManager extends EventEmitter {
    private readonly containerId: string;
    private readonly docker: Docker;
    private logStream: Readable | null = null;
    private isActive = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    constructor(containerId: string, environmentId: string) {
        super();
        this.containerId = containerId;
        this.docker = dockerClientRegistry.getClient(environmentId);
        this.setMaxListeners(50);
    }

    async start(options?: { follow?: boolean; tail?: number }): Promise<void> {
        if (this.isActive) {
            logger.warn({ containerId: this.containerId }, 'Logs stream already active');
            return;
        }

        const { follow = true, tail = 500 } = options || {};

        try {
            const container = this.docker.getContainer(this.containerId);

            await container.inspect();

            this.isActive = true;

            this.logStream = await new Promise<Readable>((resolve, reject) => {
                container.logs(
                    {
                        follow: true,
                        stdout: true,
                        stderr: true,
                        tail,
                    },
                    (err, stream) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (!stream) {
                            reject(new Error('No stream returned from logs'));
                            return;
                        }
                        resolve(stream as Readable);
                    },
                );
            });
            this.setupStreamHandlers();

            logger.info(
                { containerId: this.containerId, follow, tail },
                'Container logs stream started',
            );
        } catch (error) {
            this.isActive = false;
            const err = error as Error;
            logger.error({ err, containerId: this.containerId }, 'Failed to start logs stream');
            throw error;
        }
    }

    private setupStreamHandlers(): void {
        if (!this.logStream) return;

        this.logStream.on('data', (chunk: Buffer) => {
            try {
                this.demuxLogs(chunk);
            } catch (error) {
                logger.error({ err: error, containerId: this.containerId }, 'Error demuxing logs');
            }
        });

        this.logStream.on('error', (error: Error) => {
            logger.error({ err: error, containerId: this.containerId }, 'Log stream error');

            this.emit('log', {
                type: 'error',
                containerId: this.containerId,
                error: error.message,
                timestamp: Date.now(),
            } as ContainerLogsEvent);

            this.handleReconnect();
        });

        this.logStream.on('end', async () => {
            logger.info({ containerId: this.containerId }, 'Log stream ended');

            this.isActive = false;
            this.logStream = null;

            try {
                const container = this.docker.getContainer(this.containerId);
                const info = await container.inspect();
                if (info.State.Status === 'running') {
                    logger.info(
                        { containerId: this.containerId },
                        'Container is still running after stream end, attempting reconnect',
                    );

                    this.emit('log', {
                        type: 'end',
                        containerId: this.containerId,
                        endReason: 'stream_error',
                        timestamp: Date.now(),
                    } as ContainerLogsEvent);

                    await this.handleReconnect(true);
                } else {
                    logger.info(
                        { containerId: this.containerId },
                        'Container is not running, not reconnecting',
                    );

                    this.emit('log', {
                        type: 'end',
                        containerId: this.containerId,
                        endReason: 'container_stopped',
                        timestamp: Date.now(),
                    } as ContainerLogsEvent);
                }
            } catch (error) {
                logger.error(
                    { err: error, containerId: this.containerId },
                    'Error inspecting container after stream end, not reconnecting',
                );

                this.emit('log', {
                    type: 'end',
                    containerId: this.containerId,
                    endReason: 'stream_error',
                    timestamp: Date.now(),
                } as ContainerLogsEvent);
            }
        });
    }

    private demuxLogs(chunk: Buffer): void {
        let offset = 0;

        while (offset < chunk.length) {
            if (chunk.length - offset < 8) break;

            const header = chunk.subarray(offset, offset + 8);
            const streamType = header[0];
            const payloadSize = header.readUInt32BE(4);

            if (chunk.length - offset < 8 + payloadSize) break;

            const payload = chunk.subarray(offset + 8, offset + 8 + payloadSize);
            const logText = payload.toString('utf-8');

            const logEntry = this.parseLogLine(logText, streamType);

            if (logEntry) {
                this.emit('log', {
                    type: 'log',
                    containerId: this.containerId,
                    log: logEntry,
                    timestamp: Date.now(),
                } as ContainerLogsEvent);
            }

            offset += 8 + payloadSize;
        }
    }

    private parseLogLine(line: string, streamType: number): LogEntry | null {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const timestampMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(.*)$/);

        if (timestampMatch) {
            return {
                timestamp: timestampMatch[1],
                stream: streamType === 1 ? 'stdout' : 'stderr',
                message: timestampMatch[2],
            };
        }

        return {
            timestamp: dayjs().toISOString(),
            stream: streamType === 1 ? 'stdout' : 'stderr',
            message: trimmed,
        };
    }

    private async handleReconnect(isEndEvent: boolean = false): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error({ containerId: this.containerId }, 'Max reconnect attempts reached');
            this.stop();
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        logger.info(
            {
                containerId: this.containerId,
                attempt: this.reconnectAttempts,
                delay,
                isEndEvent,
            },
            'Attempting to reconnect logs stream',
        );

        setTimeout(async () => {
            try {
                await this.start({ follow: true, tail: isEndEvent ? 0 : 500 });
                this.reconnectAttempts = 0;
                logger.info({ containerId: this.containerId }, 'Reconnect successful');
            } catch (error) {
                logger.error({ err: error, containerId: this.containerId }, 'Reconnect failed');
                await this.handleReconnect(isEndEvent);
            }
        }, delay);
    }

    stop(): void {
        if (this.logStream) {
            this.logStream.destroy();
            this.logStream = null;
        }

        this.isActive = false;

        this.emit('log', {
            type: 'end',
            containerId: this.containerId,
            endReason: 'manual_stop',
            timestamp: Date.now(),
        } as ContainerLogsEvent);

        this.removeAllListeners();

        logger.info({ containerId: this.containerId }, 'Container logs stream stopped');
    }

    isStreamActive(): boolean {
        return this.isActive;
    }

    getContainerId(): string {
        return this.containerId;
    }
}
