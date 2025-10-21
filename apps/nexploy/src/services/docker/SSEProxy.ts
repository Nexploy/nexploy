import { SSEProxyConfig } from '@workspace/typescript-interface/sse';

export class SSEProxy {
    private controller: ReadableStreamDefaultController;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private encoder = new TextEncoder();
    private isClosed = false;
    private config: SSEProxyConfig;

    private constructor(controller: ReadableStreamDefaultController, config: SSEProxyConfig) {
        this.controller = controller;
        this.config = {
            serverUrl: process.env.SSE_SERVER_URL,
            ...config,
        };
    }

    static createResponse(config: SSEProxyConfig): Response {
        const stream = this.createStream(config);
        return new Response(stream, {
            headers: this.getDefaultHeaders(config.responseHeaders),
        });
    }

    private static createStream(config: SSEProxyConfig): ReadableStream {
        return new ReadableStream({
            async start(controller) {
                const proxy = new SSEProxy(controller, config);
                await proxy.connect();
            },
        });
    }

    private static getDefaultHeaders(customHeaders?: Record<string, string>): HeadersInit {
        return {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
            ...customHeaders,
        };
    }

    async connect(): Promise<void> {
        try {
            const backendUrl = this.buildBackendUrl();
            const response = await this.fetchBackendSSE(backendUrl);
            await this.pipeStreamToClient(response);
        } catch (error) {
            if (!this.isClosed) {
                this.handleError(error);
            }
        } finally {
            this.cleanup();
        }
    }

    private buildBackendUrl(): string {
        const url = new URL(`${this.config.serverUrl}${this.config.endpoint}`);

        if (this.config.queryParams) {
            Object.entries(this.config.queryParams).forEach(([key, value]) => {
                if (value !== null) url.searchParams.set(key, value);
            });
        }

        return url.toString();
    }

    private async fetchBackendSSE(url: string): Promise<Response> {
        const defaultHeaders = {
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        };

        const response = await fetch(url, {
            keepalive: true,
            headers: {
                ...defaultHeaders,
                ...this.config.requestHeaders,
            },
        });

        if (!response.ok || !response.body) {
            throw new Error(`Failed to connect to SSE server: ${response.statusText}`);
        }

        return response;
    }

    private async pipeStreamToClient(response: Response): Promise<void> {
        if (!response.body) return;

        this.reader = response.body.getReader();

        try {
            while (true) {
                const { done, value } = await this.reader.read();

                if (done) {
                    this.closeController();
                    break;
                }

                if (!this.isClosed) {
                    try {
                        const dataToSend = this.config.transformData
                            ? this.config.transformData(value)
                            : value;

                        this.controller.enqueue(dataToSend);
                    } catch {
                        this.isClosed = true;
                        break;
                    }
                }
            }
        } catch (error) {
            if (!this.isClosed) {
                throw error;
            }
        }
    }

    private handleError(error: unknown): void {
        if (!this.isClosed) {
            const err = error instanceof Error ? error : new Error('Unknown error');

            if (this.config.onError) {
                this.config.onError(err);
            }

            const errorMessage = this.formatSSEError(err);
            this.controller.enqueue(this.encoder.encode(errorMessage));
            this.closeController(err);
        }
    }

    private formatSSEError(error: Error): string {
        return `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`;
    }

    private closeController(error?: unknown): void {
        if (this.isClosed) return;

        this.isClosed = true;

        try {
            if (error) {
                this.controller.error(error);
            } else {
                this.controller.close();
            }
        } catch {
            /* empty */
        }

        if (this.config.onClose) {
            this.config.onClose();
        }
    }

    private cleanup(): void {
        if (this.reader) {
            try {
                this.reader.cancel();
            } catch {
                /* empty */
            }
        }
    }
}
