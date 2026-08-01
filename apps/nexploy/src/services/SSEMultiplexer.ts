import { SSEChannel, SSEEventHandler } from '@workspace/typescript-interface/sse';
import dayjs from 'dayjs';

type ChannelHandlers = Map<string, SSEEventHandler[]>;

interface ChannelConfig {
    channel: SSEChannel;
    params?: Record<string, string>;
}

const LOCAL_CHANNELS: Record<string, string> = {
    monitoring: '/api/events/monitoring/stream',
};

class SSEMultiplexerService {
    private multiplexedEventSource: EventSource | null = null;
    private localEventSources: Map<string, EventSource> = new Map();
    private subscriptions: Map<string, { config: ChannelConfig; handlers: ChannelHandlers }> = new Map();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private readonly RECONNECT_DELAY = 5000;
    private readonly SYNC_DEBOUNCE_DELAY = 50;
    private activeChannelKeys: Set<string> = new Set();
    private currentEnvironmentId: string | null = null;
    private permanentErrors: Set<string> = new Set();
    private syncTimeout: NodeJS.Timeout | null = null;
    private forceReconnectOnSync = false;
    private lastChannelMessageAt: Map<string, number> = new Map();
    private watchdogInterval: NodeJS.Timeout | null = null;
    private readonly WATCHDOG_CHECK_INTERVAL = 15000;
    private readonly CHANNEL_STALE_THRESHOLD = 90000;

    subscribe(
        channel: SSEChannel,
        event: string,
        handler: SSEEventHandler,
        params?: Record<string, string>,
    ): () => void {
        const channelKey = this.getChannelKey({ channel, params });
        const isNewChannel = !this.subscriptions.has(channelKey);

        if (!this.subscriptions.has(channelKey)) {
            this.subscriptions.set(channelKey, {
                config: { channel, params },
                handlers: new Map(),
            });
        }

        const subscription = this.subscriptions.get(channelKey)!;
        if (!subscription.handlers.has(event)) {
            subscription.handlers.set(event, []);
        }

        subscription.handlers.get(event)!.push(handler);

        const isLocalChannel = channel in LOCAL_CHANNELS;

        if (isLocalChannel) {
            if (!this.localEventSources.has(channelKey)) {
                this.connectLocalChannel(channelKey, subscription.config);
            }
        } else if (isNewChannel || !this.multiplexedEventSource) {
            this.scheduleSync();
        }

        return () => this.unsubscribe(channel, event, handler, params);
    }

    private unsubscribe(
        channel: SSEChannel,
        event: string,
        handler: SSEEventHandler,
        params?: Record<string, string>,
    ): void {
        const channelKey = this.getChannelKey({ channel, params });
        const subscription = this.subscriptions.get(channelKey);
        if (!subscription) return;

        const handlers = subscription.handlers.get(event);
        if (!handlers) return;

        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
            subscription.handlers.delete(event);
        }

        if (subscription.handlers.size > 0) return;

        this.subscriptions.delete(channelKey);

        const localEventSource = this.localEventSources.get(channelKey);
        if (localEventSource) {
            localEventSource.close();
            this.localEventSources.delete(channelKey);
        }

        this.scheduleSync();
    }

    private getRemoteChannelKeys(): string[] {
        return Array.from(this.subscriptions.keys()).filter((key) => {
            const subscription = this.subscriptions.get(key);
            return subscription && !(subscription.config.channel in LOCAL_CHANNELS);
        });
    }

    private scheduleSync(force = false): void {
        if (force) {
            this.forceReconnectOnSync = true;
        }

        if (this.syncTimeout) return;

        this.syncTimeout = setTimeout(() => {
            this.syncTimeout = null;
            const shouldForce = this.forceReconnectOnSync;
            this.forceReconnectOnSync = false;
            this.syncMultiplexed(shouldForce);
        }, this.SYNC_DEBOUNCE_DELAY);
    }

    private syncMultiplexed(force: boolean): void {
        const desiredChannelKeys = this.getRemoteChannelKeys();

        if (desiredChannelKeys.length === 0) {
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            this.permanentErrors.clear();
            this.disconnectMultiplexed();
            return;
        }

        if (!this.multiplexedEventSource) {
            this.connectMultiplexed();
            return;
        }

        if (force || !this.hasSameChannels(desiredChannelKeys)) {
            this.reconnectMultiplexed();
        }
    }

    private hasSameChannels(desiredChannelKeys: string[]): boolean {
        if (desiredChannelKeys.length !== this.activeChannelKeys.size) return false;
        return desiredChannelKeys.every((key) => this.activeChannelKeys.has(key));
    }

    private getChannelKey(config: ChannelConfig): string {
        if (!config.params || Object.keys(config.params).length === 0) {
            return config.channel;
        }
        const paramsStr = Object.entries(config.params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join(',');
        return `${config.channel}:${paramsStr}`;
    }

    private connectLocalChannel(channelKey: string, config: ChannelConfig): void {
        const endpoint = LOCAL_CHANNELS[config.channel];
        if (!endpoint) return;

        const url = new URL(endpoint, window.location.origin);

        if (config.params) {
            Object.entries(config.params).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }

        const eventSource = new EventSource(url.toString());
        this.localEventSources.set(channelKey, eventSource);

        eventSource.addEventListener('open', () => {
            const connectedEvent = JSON.stringify({
                type: 'connected',
                timestamp: Date.now(),
            });
            this.dispatch(config.channel, 'connected', connectedEvent, config.params);
        });

        eventSource.addEventListener('message', (e) => {
            try {
                const data = JSON.parse(e.data);
                const eventType = data.type || 'message';
                this.dispatch(config.channel, eventType, e.data, config.params);
            } catch (error) {
                console.error(`[SSE] Error parsing local channel message:`, error);
            }
        });

        eventSource.addEventListener('error', () => {
            const errorEvent = JSON.stringify({
                type: 'error',
                error: 'Connection lost',
                timestamp: Date.now(),
            });
            this.dispatch(config.channel, 'error', errorEvent, config.params);
            this.handleLocalChannelError(channelKey, config);
        });
    }

    private handleLocalChannelError(channelKey: string, config: ChannelConfig): void {
        const eventSource = this.localEventSources.get(channelKey);
        if (eventSource) {
            eventSource.close();
            this.localEventSources.delete(channelKey);
        }

        setTimeout(() => {
            if (this.subscriptions.has(channelKey)) {
                this.connectLocalChannel(channelKey, config);
            }
        }, this.RECONNECT_DELAY);
    }

    private connectMultiplexed(): void {
        if (this.multiplexedEventSource) {
            return;
        }

        const environmentId = this.currentEnvironmentId || 'default';
        if (this.permanentErrors.has(environmentId)) {
            return;
        }

        const remoteChannelKeys = this.getRemoteChannelKeys();

        if (remoteChannelKeys.length === 0) {
            return;
        }

        try {
            const channelsParam = remoteChannelKeys.map((channelKey) => encodeURIComponent(channelKey)).join(',');

            const url = new URL('/api/events/multiplexed', window.location.origin);
            url.searchParams.set('channels', channelsParam);

            if (this.currentEnvironmentId) {
                url.searchParams.set('environment', this.currentEnvironmentId);
            }

            this.multiplexedEventSource = new EventSource(url.toString());
            this.activeChannelKeys = new Set(remoteChannelKeys);

            this.multiplexedEventSource.addEventListener('open', () => {
                this.startWatchdog();
                this.activeChannelKeys.forEach((channelKey) => {
                    this.lastChannelMessageAt.set(channelKey, Date.now());
                    const subscription = this.subscriptions.get(channelKey);
                    if (subscription) {
                        this.dispatch(
                            subscription.config.channel,
                            'connected',
                            dayjs().toISOString(),
                            subscription.config.params,
                        );
                    }
                });
            });

            this.multiplexedEventSource.addEventListener('message', (e) => {
                try {
                    const { channel, event, data, params } = JSON.parse(e.data);

                    this.lastChannelMessageAt.set(this.getChannelKey({ channel, params }), Date.now());

                    if (event === 'error') {
                        try {
                            const errorData = JSON.parse(data);
                            if (
                                errorData.code === 'ENVIRONMENT_NOT_FOUND' ||
                                errorData.code === 'ENVIRONMENT_UNAVAILABLE'
                            ) {
                                const environmentId = this.currentEnvironmentId || 'default';
                                const alreadyKnown = this.permanentErrors.has(environmentId);
                                this.permanentErrors.add(environmentId);

                                if (!alreadyKnown) {
                                    console.warn(`[SSE] Permanent error for environment ${environmentId}`);
                                }

                                this.subscriptions.forEach((subscription) => {
                                    this.dispatch(
                                        subscription.config.channel,
                                        'error',
                                        data,
                                        subscription.config.params,
                                    );
                                });
                                this.disconnectMultiplexed();
                                return;
                            }
                        } catch {
                            /* empty */
                        }
                    }

                    this.dispatch(channel, event, data, params);
                } catch (error) {
                    console.error('[SSE] Error parsing message:', error);
                }
            });

            this.multiplexedEventSource.addEventListener('error', () => {
                this.activeChannelKeys.forEach((channelKey) => {
                    const subscription = this.subscriptions.get(channelKey);
                    if (subscription) {
                        this.dispatch(
                            subscription.config.channel,
                            'error',
                            'Connection lost',
                            subscription.config.params,
                        );
                    }
                });

                this.handleMultiplexedError();
            });
        } catch (error) {
            console.error('[SSE] Failed to establish connection:', error);
            this.handleMultiplexedError();
        }
    }

    private reconnectMultiplexed(): void {
        this.disconnectMultiplexed();
        this.connectMultiplexed();
    }

    private dispatch(channel: SSEChannel, event: string, data: string, params?: Record<string, string>): void {
        const channelKey = this.getChannelKey({ channel, params });
        const subscription = this.subscriptions.get(channelKey);

        if (!subscription) {
            console.warn(`[SSE] No handlers for channel: ${channelKey}`);
            return;
        }

        const handlers = subscription.handlers.get(event);
        if (!handlers || handlers.length === 0) {
            console.debug(`[SSE] No handlers for ${channelKey}/${event}`);
            return;
        }

        const messageEvent = new MessageEvent(event, { data });

        handlers.forEach((handler) => {
            try {
                handler(messageEvent);
            } catch (error) {
                console.error(`[SSE] Error in handler for ${channelKey}/${event}:`, error);
            }
        });
    }

    private handleMultiplexedError(): void {
        this.disconnectMultiplexed();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        const environmentId = this.currentEnvironmentId || 'default';
        if (this.permanentErrors.has(environmentId)) {
            console.warn(`[SSE] Not reconnecting due to permanent error for environment ${environmentId}`);
            return;
        }

        this.reconnectTimeout = setTimeout(() => {
            this.connectMultiplexed();
        }, this.RECONNECT_DELAY);
    }

    private startWatchdog(): void {
        this.stopWatchdog();

        this.watchdogInterval = setInterval(() => {
            if (!this.multiplexedEventSource) return;

            const now = Date.now();
            const staleChannelKey = Array.from(this.activeChannelKeys).find((channelKey) => {
                const lastMessageAt = this.lastChannelMessageAt.get(channelKey);
                return lastMessageAt !== undefined && now - lastMessageAt > this.CHANNEL_STALE_THRESHOLD;
            });

            if (!staleChannelKey) return;

            console.warn(`[SSE] No traffic on channel ${staleChannelKey}, reconnecting`);
            this.reconnectMultiplexed();
        }, this.WATCHDOG_CHECK_INTERVAL);
    }

    private stopWatchdog(): void {
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
    }

    private disconnectMultiplexed(): void {
        this.stopWatchdog();

        if (this.multiplexedEventSource) {
            this.multiplexedEventSource.close();
            this.multiplexedEventSource = null;
        }
        this.activeChannelKeys.clear();
        this.lastChannelMessageAt.clear();
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }

        this.forceReconnectOnSync = false;

        this.disconnectMultiplexed();

        this.localEventSources.forEach((eventSource) => {
            eventSource.close();
        });
        this.localEventSources.clear();
        this.permanentErrors.clear();
    }

    getActiveChannels(): Array<{ channel: SSEChannel; params?: Record<string, string> }> {
        return Array.from(this.subscriptions.values()).map(({ config }) => config);
    }

    setEnvironmentId(environmentId: string | null): void {
        if (this.currentEnvironmentId === environmentId) return;

        if (this.currentEnvironmentId) {
            this.permanentErrors.delete(this.currentEnvironmentId);
        }

        this.currentEnvironmentId = environmentId;

        if (this.subscriptions.size > 0) {
            this.scheduleSync(true);
        }
    }

    getCurrentEnvironmentId(): string | null {
        return this.currentEnvironmentId;
    }
}

export const sseMultiplexer = new SSEMultiplexerService();
