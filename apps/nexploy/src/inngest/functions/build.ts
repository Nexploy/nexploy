import dayjs from 'dayjs';
import type { Realtime } from 'inngest';
import { BuildConfig, BuildLogEntry } from '@workspace/typescript-interface/repository/build';
import { inngest } from '@/inngest/client';
import { updateNodeStatus, updateStatusBuild } from '@/services/repository/build.service';
import { createLog } from '@/services/repository/log.service';
import { LogLevel, PipelineReporter, PipelineStatus } from '@/types/pipeline.type';
import { createPipelineLogger, pipelineOrchestrator } from '@/inngest/pipeline/orchestrator';
import { getPipelineConfig } from '@/services/pipeline.service';
import { createBuildChannel } from '@/inngest/channels/build.channel';

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

            const publishLog = async (stepName: string, message: string, level: LogLevel) => {
                const log: BuildLogEntry = {
                    level,
                    buildId,
                    createdAt: dayjs().toDate(),
                    step: stepName,
                    message,
                };
                await createLog(log);
                try {
                    await inngest.realtime.publish(buildChannel.log, { log });
                } catch {
                    /* ignore */
                }
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

            const reporter: PipelineReporter = {
                async markRunning(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'running');
                    await publishSafe(buildChannel['node-status'], {
                        nodeId,
                        nodeStatus: 'running',
                    });
                },
                async markCompleted(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'completed');
                    await publishSafe(buildChannel['node-status'], {
                        nodeId,
                        nodeStatus: 'completed',
                    });
                },
                async markSkipped(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'skipped');
                    await publishSafe(buildChannel['node-status'], {
                        nodeId,
                        nodeStatus: 'skipped',
                    });
                },
                async markFailed(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'failed', 'FAILED');
                    await publishSafe(buildChannel['node-status'], {
                        nodeId,
                        nodeStatus: 'failed',
                    });
                },
                async markCancelled(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'cancelled');
                    await publishSafe(buildChannel['node-status'], {
                        nodeId,
                        nodeStatus: 'cancelled',
                    });
                },
                async markNotConfigured(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'not-configured');
                    await publishSafe(buildChannel['node-status'], {
                        nodeId,
                        nodeStatus: 'not-configured',
                    });
                },
                async publishCommitInfo(data) {
                    await publishSafe(buildChannel['commit-info'], data);
                },
            };

            const logger = createPipelineLogger(publishLog);

            const graph = await getPipelineConfig(config.repositoryId);

            if (!graph) {
                throw new Error(
                    `No pipeline configuration found for repository: ${config.repositoryId}`,
                );
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
