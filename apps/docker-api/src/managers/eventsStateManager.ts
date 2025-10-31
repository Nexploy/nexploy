import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import byline from 'byline';
import {
    DockerStatus,
    DockerStatusEvent,
} from '@workspace/typescript-interface/docker/docker.status';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import {
    DockerEventData,
    EventsStateEvent,
    EventsStateStats,
} from '@workspace/typescript-interface/docker/docker.events';

class EventsStateManager extends EventEmitter {
    private listening: boolean = false;
    private dockerEventStream: any = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private eventsReceived = 0;
    private lastEventTime: number | null = null;

    constructor() {
        super();
        this.setMaxListeners(100);
        this.setupDockerStatusListeners();
    }

    private setupDockerStatusListeners() {
        dockerStatusManager.on('status-changed', async (event: DockerStatusEvent) => {
            if (this.listening && event.status === 'connected') {
                logger.info('Docker reconnected, reinitializing events manager');
                try {
                    await this.startDockerEventsListener();
                    this.reconnectAttempts = 0;
                } catch (err) {
                    logger.error({ err }, 'Failed to reinitialize after Docker reconnection');
                }
            } else if (this.listening && event.status === 'disconnected') {
                logger.warn('Docker disconnected, stopping events stream');
                if (this.dockerEventStream) {
                    try {
                        this.dockerEventStream.destroy();
                    } catch (err) {
                        logger.error({ err }, 'Error destroying Docker events stream');
                    }
                    this.dockerEventStream = null;
                }
            }
        });
    }

    async start() {
        if (this.listening) {
            logger.warn('Events state manager already running');
            return;
        }

        this.listening = true;
        logger.info('Starting events state manager');

        const status = dockerStatusManager.getStatus();

        if (status === 'connecting') {
            await new Promise<void>((resolve) => {
                dockerStatusManager.once(
                    'status-changed',
                    ({ status }: { status: DockerStatus }) => {
                        if (status !== 'connecting') resolve();
                    },
                );
            });
        }

        if (dockerStatusManager.isConnected()) {
            try {
                await this.startDockerEventsListener();
            } catch (err) {
                logger.error({ err }, 'Failed to start Docker events listener');
            }
        } else {
            logger.warn(`Docker unavailable (status: ${status}) — events listener not started`);
        }
    }

    async stop() {
        this.listening = false;
        logger.info('Stopping events state manager');

        if (this.dockerEventStream) {
            try {
                this.dockerEventStream.destroy();
            } catch (err) {
                logger.error({ err }, 'Error destroying Docker event stream');
            }
            this.dockerEventStream = null;
        }

        this.removeAllListeners();
        this.eventsReceived = 0;
        this.lastEventTime = null;
    }

    private async startDockerEventsListener() {
        try {
            const stream = await docker.getEvents({
                filters: {
                    type: [
                        'container',
                        'image',
                        'network',
                        'volume',
                        'daemon',
                        'plugin',
                        'service',
                        'node',
                        'secret',
                        'config',
                    ],
                },
            });

            this.dockerEventStream = stream;
            this.reconnectAttempts = 0;

            const lineStream = byline.createStream(stream);

            lineStream.on('data', async (line: Buffer) => {
                const str = line.toString().trim();
                if (!str) return;

                try {
                    const event = JSON.parse(str) as DockerEventData;
                    this.handleDockerEvent(event);
                } catch (err) {
                    logger.error({ err, raw: str }, 'Error parsing Docker event');
                }
            });

            lineStream.on('error', (err: Error) => {
                logger.error({ err }, 'Docker events stream error');
                this.handleStreamError();
            });

            lineStream.on('end', () => {
                logger.warn('Docker events stream ended');
                this.handleStreamError();
            });

            logger.info('Docker events listener started - listening to all event types');
        } catch (err) {
            logger.error({ err }, 'Error starting Docker events listener');
            await this.handleStreamError();
        }
    }

    private async handleStreamError() {
        if (!this.listening) return;

        this.dockerEventStream = null;
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
            logger.error('Max reconnection attempts reached for events stream');
            return;
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        logger.info(
            { backoffDelay, attempt: this.reconnectAttempts },
            'Reconnecting to Docker events',
        );

        setTimeout(() => {
            if (this.listening && dockerStatusManager.isConnected()) {
                this.startDockerEventsListener();
            } else {
                logger.warn('Skipping event listener reconnection: Docker not connected');
            }
        }, backoffDelay);
    }

    private handleDockerEvent(event: DockerEventData) {
        this.eventsReceived++;
        this.lastEventTime = Date.now();

        logger.debug(
            {
                type: event.Type,
                action: event.Action,
                id: event.Actor.ID,
                // attributes: event.Actor.Attributes,
            },
            'Docker event received 📈',
        );

        const eventData: EventsStateEvent = {
            type: 'event',
            event,
            timestamp: Date.now(),
        };

        this.emit('docker-event', eventData);

        this.emit(`docker-event:${event.Type}`, eventData);
        this.emit(`docker-event:${event.Type}:${event.Action}`, eventData);
    }

    getStats(): EventsStateStats {
        return {
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            listening: this.listening,
            eventsReceived: this.eventsReceived,
            lastEventTime: this.lastEventTime,
        };
    }

    isListening(): boolean {
        return this.listening && this.dockerEventStream !== null;
    }

    resetStats(): void {
        this.eventsReceived = 0;
        this.lastEventTime = null;
        logger.info('Events stats reset');
    }
}

export const eventsStateManager = new EventsStateManager();
