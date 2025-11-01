import { SSEChannel, SSEEventHandler } from '@workspace/typescript-interface/sse';

type ChannelHandlers = Map<string, SSEEventHandler[]>;

class SSEMultiplexerService {
    private eventSource: EventSource | null = null;
    private subscriptions: Map<SSEChannel, ChannelHandlers> = new Map();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private readonly RECONNECT_DELAY = 5000;
    private activeChannels: Set<SSEChannel> = new Set();

    subscribe(channel: SSEChannel, event: string, handler: SSEEventHandler): () => void {
        const isNewChannel = !this.subscriptions.has(channel);

        if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Map());
        }

        const channelHandlers = this.subscriptions.get(channel)!;
        if (!channelHandlers.has(event)) {
            channelHandlers.set(event, []);
        }

        channelHandlers.get(event)!.push(handler);

        if (!this.eventSource) {
            this.connect();
        } else if (isNewChannel) {
            this.reconnect();
        }

        return () => this.unsubscribe(channel, event, handler);
    }

    private unsubscribe(channel: SSEChannel, event: string, handler: SSEEventHandler): void {
        const channelHandlers = this.subscriptions.get(channel);
        if (!channelHandlers) return;

        const handlers = channelHandlers.get(event);
        if (!handlers) return;

        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
            channelHandlers.delete(event);
        }

        const hadChannel = this.subscriptions.has(channel);
        if (channelHandlers.size === 0) {
            this.subscriptions.delete(channel);
        }

        if (this.subscriptions.size === 0) {
            this.disconnect();
        } else if (hadChannel && !this.subscriptions.has(channel)) {
            this.reconnect();
        }
    }

    private connect(): void {
        if (this.eventSource) {
            return;
        }

        try {
            const channels = Array.from(this.subscriptions.keys()).join(',');
            const url = new URL('/api/events/multiplexed', window.location.origin);
            url.searchParams.set('channels', channels);

            this.eventSource = new EventSource(url.toString());
            this.activeChannels = new Set(this.subscriptions.keys());

            this.eventSource.addEventListener('open', () => {
                console.log('[SSE] Multiplexed connection established:', channels);

                this.activeChannels.forEach((channel) => {
                    this.dispatch(channel, 'connected', new Date().toISOString());
                });
            });

            this.eventSource.addEventListener('message', (e) => {
                try {
                    const { channel, event, data } = JSON.parse(e.data);
                    this.dispatch(channel, event, data);
                } catch (error) {
                    console.error('[SSE] Error parsing message:', error);
                }
            });

            this.eventSource.addEventListener('error', () => {
                console.error('[SSE] EventSource connection error');

                this.activeChannels.forEach((channel) => {
                    this.dispatch(channel, 'error', 'Connection lost');
                });

                this.handleError();
            });
        } catch (error) {
            console.error('[SSE] Failed to establish connection:', error);
            this.handleError();
        }
    }

    private reconnect(): void {
        console.log('[SSE] Reconnecting with updated channels...');
        this.disconnect();
        this.connect();
    }

    private dispatch(channel: SSEChannel, event: string, data: string): void {
        const channelHandlers = this.subscriptions.get(channel);
        if (!channelHandlers) {
            console.warn(`[SSE] No handlers for channel: ${channel}`);
            return;
        }

        const handlers = channelHandlers.get(event);
        if (!handlers || handlers.length === 0) {
            console.debug(`[SSE] No handlers for ${channel}/${event}`);
            return;
        }

        const messageEvent = new MessageEvent(event, { data });

        handlers.forEach((handler) => {
            try {
                handler(messageEvent);
            } catch (error) {
                console.error(`[SSE] Error in handler for ${channel}/${event}:`, error);
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

        this.activeChannels.clear();
    }

    getActiveChannels(): SSEChannel[] {
        return Array.from(this.subscriptions.keys());
    }
}

export const sseMultiplexer = new SSEMultiplexerService();
