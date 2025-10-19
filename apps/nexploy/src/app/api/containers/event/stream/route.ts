export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const encoder = new TextEncoder();

    const { searchParams } = new URL(request.url);
    const containerIds = searchParams.get('containers');

    const stream = new ReadableStream({
        async start(controller) {
            let backendEventSource: Response | null = null;
            let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

            try {
                const backendUrl = new URL(
                    `${process.env.SSE_SERVER_URL || 'http://localhost:3300'}/api/containers/events/stream`,
                );

                if (containerIds) {
                    backendUrl.searchParams.set('containers', containerIds);
                }

                console.log('Connecting to backend SSE:', backendUrl.toString());

                backendEventSource = await fetch(backendUrl.toString(), {
                    headers: {
                        Accept: 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        Connection: 'keep-alive',
                    },
                });

                if (!backendEventSource.ok || !backendEventSource.body) {
                    throw new Error(
                        `Failed to connect to SSE server: ${backendEventSource.statusText}`,
                    );
                }

                reader = backendEventSource.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('Backend SSE stream ended');
                        controller.close();
                        break;
                    }

                    controller.enqueue(value);
                }
            } catch (error) {
                console.error('SSE proxy error:', error);

                const errorMessage = `event: error\ndata: ${JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error',
                })}\n\n`;
                controller.enqueue(encoder.encode(errorMessage));

                controller.error(error);
            } finally {
                if (reader) {
                    try {
                        reader.cancel();
                    } catch (e) {
                        console.error('Error cancelling reader:', e);
                    }
                }
            }
        },
        cancel() {
            console.log('Client disconnected from SSE proxy');
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
