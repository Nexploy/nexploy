import { authRouteServer, route } from '@/lib/api/nextRoute';
import { getSystemMetrics } from '@/services/monitoring.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route.use(authRouteServer).handler(async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const refreshRate = parseInt(searchParams.get('refreshRate') ?? '2000', 10);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let intervalId: NodeJS.Timeout | null = null;
            let heartbeatInterval: NodeJS.Timeout | null = null;
            let isActive = true;

            const sendMetrics = async () => {
                if (!isActive) return;

                try {
                    const metrics = await getSystemMetrics();
                    const event = {
                        type: 'metrics-update',
                        metrics,
                        timestamp: Date.now(),
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                } catch (error: unknown) {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: 'error',
                                error: 'Failed to collect metrics',
                                timestamp: Date.now(),
                            })}\n\n`,
                        ),
                    );
                }
            };

            try {
                const initialMetrics = await getSystemMetrics();
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: 'initial-state',
                            metrics: initialMetrics,
                            timestamp: Date.now(),
                        })}\n\n`,
                    ),
                );
            } catch (error) {
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: 'error',
                            error: 'Failed to get initial metrics',
                            timestamp: Date.now(),
                        })}\n\n`,
                    ),
                );
            }

            heartbeatInterval = setInterval(() => {
                if (!isActive) return;
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: 'heartbeat',
                            timestamp: Date.now(),
                        })}\n\n`,
                    ),
                );
            }, 30_000);

            intervalId = setInterval(sendMetrics, refreshRate);

            request.signal.addEventListener('abort', () => {
                isActive = false;
                if (intervalId) clearInterval(intervalId);
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                try {
                    controller.close();
                } catch {
                    /* empty */
                }
            });
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
});
