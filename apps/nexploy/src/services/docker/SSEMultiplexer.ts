import { SSEChannel, SSEEventHandler } from '@workspace/typescript-interface/sse';

type ChannelHandlers = Map<string, SSEEventHandler[]>;

interface ChannelConfig {
    channel: SSEChannel;
    params?: Record<string, string>;
}

class SSEMultiplexerService {
    private eventSource: EventSource | null = null;
    private subscriptions: Map<string, { config: ChannelConfig; handlers: ChannelHandlers }> =
        new Map();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private readonly RECONNECT_DELAY = 5000;
    private activeChannelKeys: Set<string> = new Set();

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

        if (!this.eventSource) {
            this.connect();
        } else if (isNewChannel) {
            this.reconnect();
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

        const hadChannel = this.subscriptions.has(channelKey);
        if (subscription.handlers.size === 0) {
            this.subscriptions.delete(channelKey);
        }

        if (this.subscriptions.size === 0) {
            this.disconnect();
        } else if (hadChannel && !this.subscriptions.has(channelKey)) {
            this.reconnect();
        }
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

    private buildChannelsParam(): string {
        return Array.from(this.subscriptions.values())
            .map(({ config }) => this.getChannelKey(config))
            .join(',');
    }

    private connect(): void {
        if (this.eventSource) {
            return;
        }

        try {
            const channelsParam = Array.from(this.subscriptions.keys())
                .map((channelKey) => encodeURIComponent(channelKey))
                .join(',');
            const url = new URL('/api/events/multiplexed', window.location.origin);
            url.searchParams.set('channels', channelsParam);

            this.eventSource = new EventSource(url.toString());
            this.activeChannelKeys = new Set(this.subscriptions.keys());

            this.eventSource.addEventListener('open', () => {
                console.log('[SSE] Multiplexed connection established');

                this.activeChannelKeys.forEach((channelKey) => {
                    const subscription = this.subscriptions.get(channelKey);
                    if (subscription) {
                        this.dispatch(
                            subscription.config.channel,
                            'connected',
                            new Date().toISOString(),
                            subscription.config.params,
                        );
                    }
                });
            });

            this.eventSource.addEventListener('message', (e) => {
                try {
                    const { channel, event, data, params } = JSON.parse(e.data);
                    this.dispatch(channel, event, data, params);
                } catch (error) {
                    console.error('[SSE] Error parsing message:', error);
                }
            });

            this.eventSource.addEventListener('error', () => {
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

                this.handleError();
            });
        } catch (error) {
            console.error('[SSE] Failed to establish connection:', error);
            this.handleError();
        }
    }

    private reconnect(): void {
        this.disconnect();
        this.connect();
    }

    private dispatch(
        channel: SSEChannel,
        event: string,
        data: string,
        params?: Record<string, string>,
    ): void {
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

    private handleError(): void {
        this.disconnect();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(() => {
            console.log('[SSE] Attempting to reconnect...');
            this.connect();
        }, this.RECONNECT_DELAY);
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        this.activeChannelKeys.clear();
    }

    getActiveChannels(): Array<{ channel: SSEChannel; params?: Record<string, string> }> {
        return Array.from(this.subscriptions.values()).map(({ config }) => config);
    }
}

export const sseMultiplexer = new SSEMultiplexerService();
