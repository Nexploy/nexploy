import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { buildJobStore } from '@/deployer/jobs/store';
import type { BuildLogEntry, BuildStatus } from '@/deployer/types';

const app = new Hono();

interface BuildLogsEvent {
    type: 'initial' | 'log' | 'status-change' | 'completed' | 'error' | 'heartbeat';
    jobId: string;
    logs?: BuildLogEntry[];
    log?: BuildLogEntry;
    status?: BuildStatus;
    error?: string;
    timestamp: number;
}

app.get('/logs/:jobId', (c) => {
    const jobId = c.req.param('jobId');

    return streamSSE(c, async (stream) => {
        const clientId = `build-logs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        logger.info({ clientId, jobId }, 'SSE Build logs client connected');

        let buildJob = buildJobStore.get(jobId);
        if (!buildJob) {
            buildJob = await buildJobStore.getFromRedis(jobId);
        }

        if (!buildJob) {
            await stream.writeSSE({
                data: JSON.stringify({
                    type: 'error',
                    jobId,
                    error: 'Build job not found',
                    timestamp: Date.now(),
                }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        let lastLogIndex = 0;
        let lastStatus = buildJob.status;
        let isActive = true;

        // Get initial logs from Redis
        const initialLogs = await buildJobStore.getLogs(jobId);

        const sendInitialState = async () => {
            const event: BuildLogsEvent = {
                type: 'initial',
                jobId,
                logs: initialLogs,
                status: buildJob!.status,
                timestamp: Date.now(),
            };
            await stream.writeSSE({
                data: JSON.stringify(event),
                event: 'initial',
                id: `${Date.now()}`,
            });
            lastLogIndex = initialLogs.length;
        };

        await sendInitialState();

        const pollInterval = setInterval(async () => {
            if (!isActive) return;

            // Get current job state
            let currentJob = buildJobStore.get(jobId);
            if (!currentJob) {
                currentJob = await buildJobStore.getFromRedis(jobId);
            }

            if (!currentJob) {
                clearInterval(pollInterval);
                return;
            }

            // Check for new logs in Redis
            const currentLogsCount = await buildJobStore.getLogsCount(jobId);
            if (currentLogsCount > lastLogIndex) {
                const newLogs = await buildJobStore.getLogsSince(jobId, lastLogIndex);
                for (const log of newLogs) {
                    try {
                        const event: BuildLogsEvent = {
                            type: 'log',
                            jobId,
                            log,
                            status: currentJob.status,
                            timestamp: Date.now(),
                        };
                        await stream.writeSSE({
                            data: JSON.stringify(event),
                            event: 'log',
                            id: `${Date.now()}`,
                        });
                    } catch (err) {
                        isActive = false;
                        clearInterval(pollInterval);
                        return;
                    }
                }
                lastLogIndex = currentLogsCount;
            }

            // Send status change
            if (currentJob.status !== lastStatus) {
                try {
                    const event: BuildLogsEvent = {
                        type: 'status-change',
                        jobId,
                        status: currentJob.status,
                        timestamp: Date.now(),
                    };
                    await stream.writeSSE({
                        data: JSON.stringify(event),
                        event: 'status-change',
                        id: `${Date.now()}`,
                    });
                    lastStatus = currentJob.status;

                    if (currentJob.status === 'completed' || currentJob.status === 'failed') {
                        const completedEvent: BuildLogsEvent = {
                            type: 'completed',
                            jobId,
                            status: currentJob.status,
                            error: currentJob.error,
                            timestamp: Date.now(),
                        };
                        await stream.writeSSE({
                            data: JSON.stringify(completedEvent),
                            event: 'completed',
                            id: `${Date.now()}`,
                        });
                    }
                } catch (err) {
                    isActive = false;
                    clearInterval(pollInterval);
                }
            }
        }, 500);

        const heartbeat = setInterval(async () => {
            if (!isActive) return;
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'heartbeat', jobId, timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                isActive = false;
                clearInterval(heartbeat);
                clearInterval(pollInterval);
            }
        }, 15000);

        const cleanup = () => {
            isActive = false;
            clearInterval(pollInterval);
            clearInterval(heartbeat);
            logger.info({ clientId, jobId }, 'SSE Build logs client disconnected');
        };

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
