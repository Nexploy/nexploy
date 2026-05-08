import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import dayjs from 'dayjs';
import { NextResponse } from 'next/server';
import { ChannelConfig, ChannelState, SSEChannel } from '@workspace/typescript-interface/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CHANNEL_ENDPOINTS: Record<SSEChannel, string> = {
    containers: '/api/containers/events/stream',
    container: `/api/container/events/stream/:containerId`,
    logs: `/api/container/events/stream/:containerId/logs/:follow/:tail`,
    stats: `/api/container/events/stream/:containerId/stats/:refreshRate`,
    image: '/api/image/events/stream/:imageId',
    images: '/api/images/events/stream',
    volume: '/api/volume/events/stream/:volumeName',
    network: '/api/network/events/stream/:networkId',
    docker: '/api/docker/events/stream',
    events: '/api/events/events/stream',
    volumes: '/api/volumes/events/stream',
    networks: '/api/networks/events/stream',
    service: '/api/service/events/stream/:serviceId',
    swarm: '/api/swarm/events/stream',
    traefik: '/api/traefik/events/stream',
    monitoring: '',
};

const CONFIG = {
    RETRY_DELAY: 5000,
    KEEPALIVE_INTERVAL: 30_000,
    MAX_RETRY_ATTEMPTS: 5,
    BACKOFF_MULTIPLIER: 1.5,
} as const;

const parseChannelConfig = (channelStr: string): ChannelConfig => {
    const [channel, paramsStr] = channelStr.split(':');

    if (!paramsStr) {
        return { channel: channel as SSEChannel };
    }

    const params: Record<string, string> = {};
    paramsStr.split(',').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[key.trim()] = decodeURIComponent(value.trim());
        }
    });

    return { channel: channel as SSEChannel, params };
};

const buildEndpointUrl = (template: string, params?: Record<string, string>): string => {
    if (!params) return template;

    let url = template;
    Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, encodeURIComponent(value));
    });

    return url;
};

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('docker', 'read'))
    .handler(async (request: Request) => {
        const { searchParams } = new URL(request.url);
        const channelsParam = searchParams.get('channels');
        const environment = searchParams.get('environment');

        if (!channelsParam) {
            return NextResponse.json(
                { error: 'Missing "channels" query parameter' },
                { status: 400 },
            );
        }

        const channelKeys = channelsParam.split(',').map(decodeURIComponent);
        const channelConfigs = channelKeys.map(parseChannelConfig);

        if (channelConfigs.length === 0) {
            return NextResponse.json(
                { error: 'At least one valid channel is required' },
                { status: 400 },
            );
        }

        const invalidChannels = channelConfigs.filter(
            (config) => !CHANNEL_ENDPOINTS[config.channel],
        );
        if (invalidChannels.length > 0) {
            return NextResponse.json(
                { error: `Invalid channels: ${invalidChannels.map((c) => c.channel).join(', ')}` },
                { status: 400 },
            );
        }

        const serverUrl = process.env.DOCKER_API_URL;
        if (!serverUrl) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const abortController = new AbortController();
        const channelStates = new Map<string, ChannelState>();
        let keepAliveInterval: NodeJS.Timeout | null = null;
        let isShuttingDown = false;

        const getChannelKey = (config: ChannelConfig): string => {
            if (!config.params || Object.keys(config.params).length === 0) {
                return config.channel;
            }
            const paramsStr = Object.entries(config.params)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join(',');
            return `${config.channel}:${paramsStr}`;
        };

        const cleanup = () => {
            if (isShuttingDown) return;
            isShuttingDown = true;

            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                keepAliveInterval = null;
            }

            abortController.abort();

            for (const [, state] of channelStates.entries()) {
                if (state.retryTimeout) {
                    clearTimeout(state.retryTimeout);
                    state.retryTimeout = null;
                }

                if (state.reader) {
                    state.reader.cancel().catch(() => {});
                    state.reader = null;
                }
            }

            channelStates.clear();
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
                        cleanup();
                    }
                }, CONFIG.KEEPALIVE_INTERVAL);

                const connectChannel = async (config: ChannelConfig): Promise<void> => {
                    if (isShuttingDown || abortController.signal.aborted) return;

                    const channelKey = getChannelKey(config);
                    const state = channelStates.get(channelKey) ?? {
                        reader: null,
                        retryCount: 0,
                        retryTimeout: null,
                    };
                    channelStates.set(channelKey, state);

                    if (state.retryCount >= CONFIG.MAX_RETRY_ATTEMPTS) {
                        try {
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({
                                        channel: config.channel,
                                        params: config.params,
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

                    const endpointTemplate = CHANNEL_ENDPOINTS[config.channel];

                    const channelEnvironment = config.params?.environment;
                    const effectiveEnvironment = channelEnvironment ?? environment;

                    let buildParams = config.params;
                    if (buildParams?.environment) {
                        const { environment: _, ...rest } = buildParams;
                        buildParams = Object.keys(rest).length > 0 ? rest : undefined;
                    }

                    const endpoint = buildEndpointUrl(endpointTemplate, buildParams);
                    let url = `${serverUrl}${endpoint}`;

                    if (effectiveEnvironment) {
                        const separator = url.includes('?') ? '&' : '?';
                        url += `${separator}environment=${encodeURIComponent(effectiveEnvironment)}`;
                    }

                    try {
                        const sseHeaders: Record<string, string> = {
                            Accept: 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            Connection: 'keep-alive',
                        };
                        if (process.env.DOCKER_API_KEY) {
                            sseHeaders['Authorization'] = `Bearer ${process.env.DOCKER_API_KEY}`;
                        }
                        const response = await fetch(url, {
                            headers: sseHeaders,
                            signal: abortController.signal,
                        });

                        if (!response.ok) {
                            if (response.status === 404) {
                                try {
                                    const errorData = await response.json();
                                    if (errorData.code === 'ENVIRONMENT_NOT_FOUND') {
                                        throw new Error(
                                            JSON.stringify({
                                                code: 'ENVIRONMENT_NOT_FOUND',
                                                message: errorData.error,
                                                environmentId: errorData.environmentId,
                                            }),
                                        );
                                    }
                                } catch {
                                    /* empty */
                                }
                            }

                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        if (!response.body) {
                            throw new Error('Response body is null');
                        }

                        const reader = response.body.getReader();
                        state.reader = reader;
                        state.retryCount = 0;

                        try {
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({
                                        channel: config.channel,
                                        params: config.params,
                                        event: 'connected',
                                        data: dayjs().toISOString(),
                                    })}\n\n`,
                                ),
                            );
                        } catch {
                            /* empty */
                        }

                        let buffer = '';

                        while (!isShuttingDown && !abortController.signal.aborted) {
                            const { done, value } = await reader.read();

                            if (done) {
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
                                    continue;
                                }

                                const event = eventMatch[1]?.trim();
                                const data = dataMatch[1]?.trim();

                                if (!event || !data) continue;

                                try {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                channel: config.channel,
                                                params: config.params,
                                                event,
                                                data,
                                            })}\n\n`,
                                        ),
                                    );
                                } catch {
                                    cleanup();
                                    return;
                                }
                            }
                        }

                        state.reader = null;

                        if (!isShuttingDown && !abortController.signal.aborted) {
                            scheduleRetry(config);
                        }
                    } catch (err) {
                        state.reader = null;

                        if (abortController.signal.aborted || isShuttingDown) {
                            return;
                        }

                        let errorData: any = err instanceof Error ? err.message : String(err);
                        let shouldRetry = true;

                        try {
                            const parsed = JSON.parse(errorData);
                            if (parsed.code === 'ENVIRONMENT_NOT_FOUND') {
                                shouldRetry = false;
                                errorData = JSON.stringify(parsed);
                            }
                        } catch {
                            /* empty */
                        }

                        try {
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({
                                        channel: config.channel,
                                        params: config.params,
                                        event: 'error',
                                        data: errorData,
                                    })}\n\n`,
                                ),
                            );
                        } catch {
                            /* empty */
                        }

                        if (shouldRetry) {
                            scheduleRetry(config);
                        }
                    }
                };

                const scheduleRetry = (config: ChannelConfig) => {
                    if (isShuttingDown || abortController.signal.aborted) return;

                    const channelKey = getChannelKey(config);
                    const state = channelStates.get(channelKey);
                    if (!state) return;

                    state.retryCount++;
                    const delay = calculateRetryDelay(state.retryCount);

                    try {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    channel: config.channel,
                                    params: config.params,
                                    event: 'reconnecting',
                                    data: JSON.stringify({
                                        attempt: state.retryCount,
                                        delay,
                                        maxAttempts: CONFIG.MAX_RETRY_ATTEMPTS,
                                    }),
                                })}\n\n`,
                            ),
                        );
                    } catch {
                        /* empty */
                    }

                    state.retryTimeout = setTimeout(() => {
                        state.retryTimeout = null;
                        connectChannel(config);
                    }, delay);
                };

                await Promise.allSettled(channelConfigs.map((config) => connectChannel(config)));
            },

            cancel() {},
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
