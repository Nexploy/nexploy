import dayjs from 'dayjs';
import type { Realtime } from 'inngest';
import { BuildConfig, BuildLogEntry } from '@workspace/typescript-interface/repository/build';
import { inngest } from '@/inngest/client';
import { updateNodeStatus, updateStatusBuild } from '@/services/repository/build.service';
import { createLogsBatch } from '@/services/repository/log.service';
import { LogLevel, PipelineReporter, PipelineStatus } from '@workspace/typescript-interface/pipeline/pipeline';
import { createPipelineLogger, pipelineOrchestrator } from '@/inngest/pipeline/orchestrator';
import { getPipelineConfig } from '@/services/pipeline.service';
import { createBuildChannel } from '@/inngest/channels/build.channel';
import { BuildStatus } from 'generated/client';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const buildFunction = inngest.createFunction(
    {
        id: 'build-pipeline',
        triggers: [{ event: 'build/start' }],
        cancelOn: [{ event: 'build/cancel', if: 'event.data.buildId == async.data.buildId' }],
        retries: 0,
    },
    async ({ event, step }) => {
        const { buildId, config } = event.data as { buildId: string; config: BuildConfig };

        {
            const buildChannel = createBuildChannel(buildId);

            const LOG_FLUSH_THRESHOLD = 25;
            let logBuffer: BuildLogEntry[] = [];

            const flushLogs = async () => {
                if (logBuffer.length === 0) return;
                const batch = logBuffer;
                logBuffer = [];
                try {
                    await createLogsBatch(batch);
                } catch {
                    /* ignore */
                }
            };

            const publishLog = async (stepName: string, message: string, level: LogLevel) => {
                const log: BuildLogEntry = {
                    level,
                    buildId,
                    createdAt: dayjs().toDate(),
                    step: stepName,
                    message,
                };
                logBuffer.push(log);
                try {
                    await inngest.realtime.publish(buildChannel.log, { log });
                } catch {
                    /* ignore */
                }
                if (logBuffer.length >= LOG_FLUSH_THRESHOLD) await flushLogs();
            };

            const publishSafe = async <T>(ref: Realtime.TopicRef<T>, data: T): Promise<void> => {
                try {
                    await inngest.realtime.publish(ref, data);
                } catch {
                    /* ignore */
                }
            };

            const setStatusBuild = async (status: PipelineStatus) => {
                await updateStatusBuild(buildId, status);
                await publishSafe(buildChannel['build-status'], { buildStatus: status });
            };

            const nodeStartTimes = new Map<string, number>();

            const mark = async (
                nodeId: string,
                nodeStatus: string,
                buildStatus?: BuildStatus,
                durationMs?: number,
                startedAt?: number,
            ) =>
                Promise.all([
                    updateNodeStatus(buildId, nodeId, nodeStatus, buildStatus, durationMs, startedAt),
                    publishSafe(buildChannel['node-status'], {
                        nodeId,
                        nodeStatus,
                        durationMs,
                        startedAt,
                    }),
                ]).then(() => undefined);

            const elapsed = (nodeId: string): number | undefined => {
                const start = nodeStartTimes.get(nodeId);
                return start !== undefined ? Date.now() - start : undefined;
            };

            const reporter: PipelineReporter = {
                markRunning: (nodeId) => {
                    const startedAt = Date.now();
                    nodeStartTimes.set(nodeId, startedAt);
                    return mark(nodeId, 'running', undefined, undefined, startedAt);
                },
                markCompleted: (nodeId) => mark(nodeId, 'completed', undefined, elapsed(nodeId)),
                markSkipped: (nodeId) => mark(nodeId, 'skipped'),
                markFailed: (nodeId) => mark(nodeId, 'failed', 'FAILED', elapsed(nodeId)),
                markCancelled: (nodeId) => mark(nodeId, 'cancelled', undefined, elapsed(nodeId)),
                markNotConfigured: (nodeId) => mark(nodeId, 'not-configured'),
                async publishCommitInfo(data) {
                    await publishSafe(buildChannel['commit-info'], data);
                },
            };

            const logger = createPipelineLogger(publishLog, flushLogs);

            if (!config.stageId) {
                throw new Error((await getErrorTranslator())('build.noStageAssociated'));
            }

            const graph = await getPipelineConfig(config.stageId);

            if (!graph) {
                throw new Error(`No pipeline configuration found for stage: ${config.stageId}`);
            }

            return await pipelineOrchestrator.execute(
                buildId,
                config,
                graph,
                step,
                logger,
                reporter,
                setStatusBuild,
            );
        }
    },
);
