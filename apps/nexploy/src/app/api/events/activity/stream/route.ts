import type {
    ActivityLogEntry,
    ActivityPurgeResult,
    ActivityStreamEvent,
} from '@workspace/typescript-interface/activity';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { subscribeActivityCreated, subscribeActivityPurged } from '@/lib/activity/activityBus';
import { getRecentActivityLogs } from '@/services/activityLog.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;
const HEARTBEAT_INTERVAL = 30_000;

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('activity', 'read'))
    .handler(async (request: Request) => {
        const { searchParams } = new URL(request.url);
        const requestedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
        const limit = Number.isFinite(requestedLimit)
            ? Math.min(MAX_LIMIT, Math.max(1, requestedLimit))
            : DEFAULT_LIMIT;

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                let isActive = true;

                const send = (event: ActivityStreamEvent) => {
                    if (!isActive) return;

                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                    } catch {
                        isActive = false;
                    }
                };

                try {
                    const { entries, hasMore } = await getRecentActivityLogs(limit);
                    send({ type: 'initial-state', entries, hasMore, timestamp: Date.now() });
                } catch (error) {
                    console.error('[ACTIVITY STREAM] Failed to load initial state', error);
                    send({ type: 'error', error: 'Failed to load activity', timestamp: Date.now() });
                }

                const unsubscribeCreated = subscribeActivityCreated((entry: ActivityLogEntry) => {
                    send({ type: 'activity-created', entry, timestamp: Date.now() });
                });

                const unsubscribePurged = subscribeActivityPurged(({ purged, purgedBefore }: ActivityPurgeResult) => {
                    send({ type: 'activity-purged', purged, purgedBefore, timestamp: Date.now() });
                });

                const heartbeatInterval = setInterval(() => {
                    send({ type: 'heartbeat', timestamp: Date.now() });
                }, HEARTBEAT_INTERVAL);

                request.signal.addEventListener('abort', () => {
                    isActive = false;
                    clearInterval(heartbeatInterval);
                    unsubscribeCreated();
                    unsubscribePurged();

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
