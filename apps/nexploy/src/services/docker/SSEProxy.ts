const SSE_SERVER_URL = process.env.SSE_SERVER_URL || 'http://localhost:3300';
const SSE_ENDPOINT = '/api/containers/events/stream';

export class SSEProxy {
    private controller: ReadableStreamDefaultController;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private encoder = new TextEncoder();
    private isClosed = false;

    private constructor(controller: ReadableStreamDefaultController) {
        this.controller = controller;
    }

    static createResponse(containerIds: string | null): Response {
        const stream = this.createStream(containerIds);
        return new Response(stream, {
            headers: this.getHeaders(),
        });
    }

    private static createStream(containerIds: string | null): ReadableStream {
        return new ReadableStream({
            async start(controller) {
                const proxy = new SSEProxy(controller);
                await proxy.connect(containerIds);
            },
        });
    }

    private static getHeaders(): HeadersInit {
        return {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        };
    }

    async connect(containerIds: string | null): Promise<void> {
        try {
            const backendUrl = this.buildBackendUrl(containerIds);

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

    private buildBackendUrl(containerIds: string | null): string {
        const url = new URL(`${SSE_SERVER_URL}${SSE_ENDPOINT}`);

        if (containerIds) {
            url.searchParams.set('containers', containerIds);
        }

        return url.toString();
    }

    private async fetchBackendSSE(url: string): Promise<Response> {
        const response = await fetch(url, {
            headers: {
                Accept: 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
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
                        this.controller.enqueue(value);
                    } catch (error) {
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
            const errorMessage = this.formatSSEError(error);
            this.controller.enqueue(this.encoder.encode(errorMessage));
            this.closeController(error);
        }
    }

    private formatSSEError(error: unknown): string {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`;
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
        } catch {}
    }

    private cleanup(): void {
        if (this.reader) {
            try {
                this.reader.cancel();
            } catch {}
        }
    }
}
