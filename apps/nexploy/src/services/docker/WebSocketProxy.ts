import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocketProxyConfig } from '@workspace/typescript-interface/webSocketProxyConfig';

export class WebSocketProxy {
    private clientWebSocket: WebSocket | null = null;
    private backendWebSocket: WebSocket | null = null;
    private isClosed = false;
    private config: WebSocketProxyConfig;
    private pingInterval: NodeJS.Timeout | null = null;
    private lastActivityTime: number = Date.now();
    private readonly PING_INTERVAL = 30000;
    private readonly CONNECTION_TIMEOUT = 120000;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 3;

    private constructor(clientWebSocket: WebSocket, config: WebSocketProxyConfig) {
        this.clientWebSocket = clientWebSocket;
        this.config = {
            serverUrl: process.env.WS_DOCKER_API_URL || 'ws://localhost:3300',
            ...config,
        };
    }

    static handleUpgrade(
        request: IncomingMessage,
        socket: Duplex,
        head: Buffer,
        config: WebSocketProxyConfig,
    ): void {
        const wss = new WebSocketServer({ noServer: true });

        wss.handleUpgrade(request, socket, head, (clientWebSocket) => {
            const proxy = new WebSocketProxy(clientWebSocket, config);
            proxy.connect();
        });
    }

    async connect(): Promise<void> {
        try {
            const backendUrl = this.buildBackendUrl();
            console.log(`Connecting to backend WebSocket: ${backendUrl}`);
            await this.connectToBackend(backendUrl);
            this.setupClientListeners();
            this.setupBackendListeners();
            this.startPingInterval();
        } catch (error) {
            if (!this.isClosed) {
                console.error('Connection error:', error);
                this.handleError(error);
            }
        }
    }

    private buildBackendUrl(): string {
        let baseUrl = this.config.serverUrl || '';

        if (!baseUrl.startsWith('ws://') && !baseUrl.startsWith('wss://')) {
            baseUrl = `ws://${baseUrl}`;
        }

        const url = new URL(`${baseUrl}${this.config.endpoint}`);

        if (this.config.queryParams) {
            Object.entries(this.config.queryParams).forEach(([key, value]) => {
                if (value !== null) url.searchParams.set(key, value);
            });
        }

        return url.toString();
    }

    private async connectToBackend(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const wsOptions: WebSocket.ClientOptions = {
                    headers: {
                        ...this.config.requestHeaders,
                    },
                    handshakeTimeout: 10000,
                };

                this.backendWebSocket = new WebSocket(url, wsOptions);

                const connectionTimeout = setTimeout(() => {
                    if (this.backendWebSocket?.readyState !== WebSocket.OPEN) {
                        this.backendWebSocket?.close();
                        reject(new Error('Backend WebSocket connection timeout'));
                    }
                }, 10000);

                this.backendWebSocket.on('open', () => {
                    clearTimeout(connectionTimeout);
                    this.reconnectAttempts = 0;
                    console.log('Backend WebSocket connected');
                    resolve();
                });

                this.backendWebSocket.on('error', (error) => {
                    clearTimeout(connectionTimeout);
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    private setupClientListeners(): void {
        if (!this.clientWebSocket) return;

        this.clientWebSocket.on('message', (data, isBinary) => {
            console.log('Received client message, binary:', isBinary);
            this.handleClientMessage(data, isBinary);
        });

        this.clientWebSocket.on('close', () => {
            console.log('Client WebSocket closed');
            this.cleanup();
        });

        this.clientWebSocket.on('error', (error) => {
            console.error('Client WebSocket error:', error);
            this.handleError(error);
        });

        this.clientWebSocket.on('pong', () => {
            this.lastActivityTime = Date.now();
        });
    }

    private setupBackendListeners(): void {
        if (!this.backendWebSocket) return;

        this.backendWebSocket.on('message', (data, isBinary) => {
            console.log('Received backend message, binary:', isBinary);
            this.handleBackendMessage(data, isBinary);
        });

        this.backendWebSocket.on('close', (code, reason) => {
            console.log('Backend WebSocket closed', code, reason.toString());
            if (!this.isClosed) {
                this.handleBackendClose(code, reason);
            }
        });

        this.backendWebSocket.on('error', (error) => {
            console.error('Backend WebSocket error:', error);
            this.handleError(error);
        });

        this.backendWebSocket.on('pong', () => {
            this.lastActivityTime = Date.now();
        });
    }

    private handleClientMessage(data: WebSocket.RawData, isBinary: boolean): void {
        if (this.isClosed || !this.backendWebSocket) return;
        this.lastActivityTime = Date.now();
        try {
            let dataToSend = data;
            if (this.config.transformClientMessage) {
                dataToSend = this.config.transformClientMessage(data);
            }
            if (this.backendWebSocket.readyState === WebSocket.OPEN) {
                this.backendWebSocket.send(dataToSend, { binary: isBinary });
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    private handleBackendMessage(data: WebSocket.RawData, isBinary: boolean): void {
        if (this.isClosed || !this.clientWebSocket) return;
        this.lastActivityTime = Date.now();
        try {
            let dataToSend = data;
            if (this.config.transformBackendMessage) {
                dataToSend = this.config.transformBackendMessage(data);
            }
            if (this.clientWebSocket.readyState === WebSocket.OPEN) {
                this.clientWebSocket.send(dataToSend, { binary: isBinary });
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    private async handleBackendClose(code: number, reason: Buffer): Promise<void> {
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS && !this.isClosed) {
            this.reconnectAttempts++;
            console.warn(
                `Backend closed (${code}). Attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`,
            );
            try {
                const backendUrl = this.buildBackendUrl();
                await this.connectToBackend(backendUrl);
                this.setupBackendListeners();
            } catch (error) {
                if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
                    this.handleError(new Error('Max reconnection attempts reached'));
                    this.cleanup();
                }
            }
        } else {
            this.cleanup();
        }
    }

    private startPingInterval(): void {
        this.pingInterval = setInterval(() => {
            if (this.isClosed) {
                this.stopPingInterval();
                return;
            }
            try {
                if (this.backendWebSocket?.readyState === WebSocket.OPEN) {
                    this.backendWebSocket.ping();
                }
                if (this.clientWebSocket?.readyState === WebSocket.OPEN) {
                    this.clientWebSocket.ping();
                }
                const timeSinceLastActivity = Date.now() - this.lastActivityTime;
                if (timeSinceLastActivity > this.CONNECTION_TIMEOUT) {
                    console.warn('Timeout - no activity for', timeSinceLastActivity, 'ms');
                    this.cleanup();
                }
            } catch (error) {
                this.stopPingInterval();
            }
        }, this.PING_INTERVAL);
    }

    private stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private handleError(error: unknown): void {
        if (this.isClosed) return;
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error('WebSocket proxy error:', err);
        if (this.config.onError) {
            this.config.onError(err);
        }
        if (this.clientWebSocket?.readyState === WebSocket.OPEN) {
            try {
                this.clientWebSocket.send(JSON.stringify({ type: 'error', error: err.message }));
            } catch {
                /* ignore */
            }
        }
        this.cleanup();
    }

    private cleanup(): void {
        if (this.isClosed) return;
        this.isClosed = true;
        this.stopPingInterval();
        if (this.backendWebSocket) {
            try {
                if (this.backendWebSocket.readyState === WebSocket.OPEN) {
                    this.backendWebSocket.close(1000, 'Proxy closing');
                }
            } catch {
                /* ignore */
            }
            this.backendWebSocket = null;
        }
        if (this.clientWebSocket) {
            try {
                if (this.clientWebSocket.readyState === WebSocket.OPEN) {
                    this.clientWebSocket.close(1000, 'Proxy closing');
                }
            } catch {
                /* ignore */
            }
            this.clientWebSocket = null;
        }
        if (this.config.onClose) {
            this.config.onClose();
        }
    }
}
