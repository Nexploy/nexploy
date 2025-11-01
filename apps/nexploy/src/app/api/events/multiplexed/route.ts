import { route } from '@/lib/api/nextRoute';
import { NextResponse } from 'next/server';
import { SSEChannel } from '@workspace/typescript-interface/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CHANNEL_ENDPOINTS: Record<SSEChannel, string> = {
    containers: '/api/containers/events/stream',
    images: '/api/images/events/stream',
    docker: '/api/docker/events/stream',
    events: '/api/events/events/stream',
    volumes: '/api/volumes/events/stream',
    networks: '/api/networks/events/stream',
};

const CONFIG = {
    RETRY_DELAY: 5000,
    KEEPALIVE_INTERVAL: 30_000,
    MAX_RETRY_ATTEMPTS: 5,
    BACKOFF_MULTIPLIER: 1.5,
} as const;

interface ChannelState {
    reader: ReadableStreamDefaultReader<Uint8Array> | null;
    retryCount: number;
    retryTimeout: NodeJS.Timeout | null;
}

export const GET = route.handler(async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const channelsParam = searchParams.get('channels');

    if (!channelsParam) {
        return NextResponse.json({ error: 'Missing "channels" query parameter' }, { status: 400 });
    }

    const channels = channelsParam.split(',').filter(Boolean) as SSEChannel[];

    if (channels.length === 0) {
        return NextResponse.json(
            { error: 'At least one valid channel is required' },
            { status: 400 },
        );
    }

    const invalidChannels = channels.filter((ch) => !CHANNEL_ENDPOINTS[ch]);
    if (invalidChannels.length > 0) {
        return NextResponse.json(
            { error: `Invalid channels: ${invalidChannels.join(', ')}` },
            { status: 400 },
        );
    }

    const serverUrl = process.env.SSE_SERVER_URL;
    if (!serverUrl) {
        console.error('[SSE] Missing SSE_SERVER_URL environment variable');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const abortController = new AbortController();
    const channelStates = new Map<SSEChannel, ChannelState>();
    let keepAliveInterval: NodeJS.Timeout | null = null;
    let isShuttingDown = false;

    const cleanup = () => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log('[SSE] Starting cleanup...');

        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
        }

        abortController.abort();

        for (const [channel, state] of channelStates.entries()) {
            if (state.retryTimeout) {
                clearTimeout(state.retryTimeout);
                state.retryTimeout = null;
            }

            if (state.reader) {
                state.reader.cancel().catch(() => {});
                state.reader = null;
            }

            console.log(`[SSE] Cleaned up channel: ${channel}`);
        }

        channelStates.clear();
        console.log('[SSE] Cleanup complete');
    };

    const calculateRetryDelay = (retryCount: number): number => {
        return Math.min(
            CONFIG.RETRY_DELAY * Math.pow(CONFIG.BACKOFF_MULTIPLIER, retryCount),
            20_000,
        );
    };

    const stream = new ReadableStream({
        async start(controller) {
            keepAliveInterval = setInterval(() => {
                if (isShuttingDown) return;
                try {
                    controller.enqueue(encoder.encode(':keepalive\n\n'));
                } catch (err) {
                    console.error('[SSE] Keepalive failed:', err);
                    cleanup();
                }
            }, CONFIG.KEEPALIVE_INTERVAL);

            const connectChannel = async (channel: SSEChannel): Promise<void> => {
                if (isShuttingDown || abortController.signal.aborted) return;

                const state = channelStates.get(channel) ?? {
                    reader: null,
                    retryCount: 0,
                    retryTimeout: null,
                };
                channelStates.set(channel, state);

                if (state.retryCount >= CONFIG.MAX_RETRY_ATTEMPTS) {
                    console.error(
                        `[SSE] Channel ${channel} exceeded max retry attempts (${CONFIG.MAX_RETRY_ATTEMPTS})`,
                    );
                    try {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    channel,
                                    event: 'error',
                                    data: 'Max retry attempts exceeded',
                                })}\n\n`,
                            ),
                        );
                    } catch {
                        /* empty */
                    }
                    return;
                }

                const endpoint = CHANNEL_ENDPOINTS[channel];
                const url = `${serverUrl}${endpoint}`;

                try {
                    console.log(`[SSE] Connecting to ${channel} (attempt ${state.retryCount + 1})`);

                    const response = await fetch(url, {
                        headers: {
                            Accept: 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            Connection: 'keep-alive',
                        },
                        signal: abortController.signal,
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    if (!response.body) {
                        throw new Error('Response body is null');
                    }

                    const reader = response.body.getReader();
                    state.reader = reader;
                    state.retryCount = 0;

                    console.log(`[SSE] ✓ Connected to ${channel}`);

                    try {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    channel,
                                    event: 'connected',
                                    data: new Date().toISOString(),
                                })}\n\n`,
                            ),
                        );
                    } catch (err) {
                        console.error(`[SSE] Failed to send connected event:`, err);
                    }

                    let buffer = '';

                    while (!isShuttingDown && !abortController.signal.aborted) {
                        const { done, value } = await reader.read();

                        if (done) {
                            console.warn(`[SSE] Channel ${channel} stream ended`);
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const messages = buffer.split('\n\n');
                        buffer = messages.pop() || '';

                        for (const raw of messages) {
                            if (!raw.trim()) continue;

                            const eventMatch = raw.match(/^event:\s*(.+)$/m);
                            const dataMatch = raw.match(/^data:\s*(.+)$/m);

                            if (!eventMatch || !dataMatch) {
                                console.warn(`[SSE] Malformed message on ${channel}:`, raw);
                                continue;
                            }

                            const event = eventMatch[1]?.trim();
                            const data = dataMatch[1]?.trim();

                            if (!event || !data) continue;

                            try {
                                controller.enqueue(
                                    encoder.encode(
                                        `data: ${JSON.stringify({ channel, event, data })}\n\n`,
                                    ),
                                );
                            } catch (err) {
                                console.error(`[SSE] Failed to enqueue message:`, err);
                                cleanup();
                                return;
                            }
                        }
                    }

                    state.reader = null;

                    if (!isShuttingDown && !abortController.signal.aborted) {
                        console.warn(`[SSE] Channel ${channel} disconnected. Scheduling retry...`);
                        scheduleRetry(channel);
                    }
                } catch (err) {
                    state.reader = null;

                    if (abortController.signal.aborted || isShuttingDown) {
                        console.log(`[SSE] Channel ${channel} aborted (expected during shutdown)`);
                        return;
                    }

                    console.error(`[SSE] Channel ${channel} error:`, err);

                    try {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    channel,
                                    event: 'error',
                                    data: err instanceof Error ? err.message : String(err),
                                })}\n\n`,
                            ),
                        );
                    } catch {
                        /* empty */
                    }

                    scheduleRetry(channel);
                }
            };

            const scheduleRetry = (channel: SSEChannel) => {
                if (isShuttingDown || abortController.signal.aborted) return;

                const state = channelStates.get(channel);
                if (!state) return;

                state.retryCount++;
                const delay = calculateRetryDelay(state.retryCount);

                console.log(
                    `[SSE] Retrying ${channel} in ${delay}ms (attempt ${state.retryCount}/${CONFIG.MAX_RETRY_ATTEMPTS})`,
                );

                try {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                channel,
                                event: 'reconnecting',
                                data: JSON.stringify({
                                    attempt: state.retryCount,
                                    delay,
                                    maxAttempts: CONFIG.MAX_RETRY_ATTEMPTS,
                                }),
                            })}\n\n`,
                        ),
                    );
                } catch (err) {
                    console.error(`[SSE] Failed to send reconnecting event:`, err);
                }

                state.retryTimeout = setTimeout(() => {
                    state.retryTimeout = null;
                    connectChannel(channel);
                }, delay);
            };

            await Promise.allSettled(channels.map((ch) => connectChannel(ch)));

            console.log(`[SSE] All channels initialized for: ${channels.join(', ')}`);
        },

        cancel() {
            console.log('[SSE] Client disconnected, cleaning up...');
            cleanup();
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
