import { logger } from '@/utils/logger';
import {
    DockerEventData,
    EventsStateEvent,
    EventsStateStats,
} from '@workspace/typescript-interface/docker/docker.events';
import { BaseStateManager } from '@/lib/BaseStateManager';

export class EventsStateManager extends BaseStateManager {
    private eventsReceived = 0;
    private lastEventTime: number | null = null;
    private events: DockerEventData[] = [];
    private readonly MAX_EVENTS = 1000;

    constructor(environmentId: string) {
        super({
            managerName: `Events State Manager [${environmentId}]`,
            environmentId,
            pollIntervalMs: 0,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
    }

    async loadInitialState(): Promise<void> {
        return;
    }

    async handleDockerEvent(event: any): Promise<void> {
        this.eventsReceived++;
        this.lastEventTime = Date.now();

        this.events.unshift(event);

        if (this.events.length > this.MAX_EVENTS) {
            this.events = this.events.slice(0, this.MAX_EVENTS);
        }

        if (this.eventsReceived > this.MAX_EVENTS) this.eventsReceived = this.MAX_EVENTS;

        logger.debug(
            {
                type: event.Type,
                action: event.Action,
                id: event.Actor.ID,
                eventsInMemory: this.events.length,
            },
            'Docker event received',
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

    async fullStateSync(): Promise<void> {
        return;
    }

    getEventFilters(): Record<string, string[]> {
        return {
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
        };
    }

    protected onStop(): void {
        this.events = [];
        this.eventsReceived = 0;
        this.lastEventTime = null;
    }

    protected getCustomStats(): Record<string, any> {
        return {
            eventsReceived: this.eventsReceived,
            lastEventTime: this.lastEventTime,
        };
    }

    getEventStats(): EventsStateStats {
        return {
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            listening: this.polling,
            eventsReceived: this.eventsReceived,
            lastEventTime: this.lastEventTime,
        };
    }

    isListening(): boolean {
        return this.polling && this.dockerEventStream !== null;
    }

    resetStats(): void {
        this.eventsReceived = 0;
        this.lastEventTime = null;
        logger.info('Events stats reset');
    }

    getAllEvents(): DockerEventData[] {
        return [...this.events];
    }

    getRecentEvents(count: number): DockerEventData[] {
        return this.events.slice(0, count);
    }

    clearEvents(): void {
        this.events = [];
        this.eventsReceived = 0;
        this.lastEventTime = null;
        logger.info('Events cleared from memory');
    }
}

import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';

export function getEventsStateManager(): EventsStateManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (!defaultId) {
            throw new Error('No Docker environment available');
        }
        return stateManagerFactory.getManagers(defaultId).events;
    }
    return stateManagerFactory.getManagers(environmentId).events;
}

export const eventsStateManager = new Proxy({} as EventsStateManager, {
    get(_target, prop) {
        const manager = getEventsStateManager();
        const value = (manager as any)[prop];
        if (typeof value === 'function') {
            return value.bind(manager);
        }
        return value;
    },
});
