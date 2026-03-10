import { channel, topic } from '@inngest/realtime';
import dayjs from 'dayjs';
import { BuildConfig, BuildLogEntry } from '@workspace/typescript-interface/inngest/build';
import { inngest } from '@/inngest/client';
import { updateNodeStatus, updateStatusBuild } from '@/services/inngest/build.inngest.service';
import { createLogInngest } from '@/services/inngest/log.inngest.service';
import { LogLevel, PipelineReporter, PipelineStatus } from '@/types/pipeline.type';
import { createPipelineLogger, pipelineOrchestrator } from '@/inngest/pipeline/orchestrator';
import { runWithEnvironmentContextAsync } from '@/lib/environmentContext';
import { prisma } from '../../../prisma/prisma';
import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';

const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('build-status').type<{ buildStatus: string }>())
        .addTopic(topic('node-status').type<{ nodeId: string; nodeStatus: string }>());
    return channelDef();
};

export const buildFunction = inngest.createFunction(
    {
        id: 'build-pipeline',
        cancelOn: [{ event: 'build/cancel', if: 'event.data.buildId == async.data.buildId' }],
        retries: 0,
    },
    { event: 'build/start' },
    async ({ event, step, publish }) => {
        const { buildId, config } = event.data as { buildId: string; config: BuildConfig };

        return await runWithEnvironmentContextAsync(config.environmentId, async () => {
            const buildChannel = createBuildChannel(buildId);

            const publishLog = async (stepName: string, message: string, level: LogLevel) => {
                const log: BuildLogEntry = {
                    level,
                    buildId,
                    createdAt: dayjs().toDate(),
                    step: stepName,
                    message,
                };
                await createLogInngest(log);
                await publish(buildChannel.log({ log }));
            };

            const publishSafe = async (payload: Parameters<typeof publish>[0]) => {
                try {
                    await publish(payload);
                } catch {
                    /* ignore */
                }
            };

            const setStatus = async (status: PipelineStatus) => {
                await updateStatusBuild(buildId, status);
                await publishSafe(buildChannel['build-status']({ buildStatus: status }));
            };

            const reporter: PipelineReporter = {
                async markRunning(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'running');
                    await publishSafe(
                        buildChannel['node-status']({ nodeId, nodeStatus: 'running' }),
                    );
                },
                async markCompleted(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'completed');
                    await publishSafe(
                        buildChannel['node-status']({ nodeId, nodeStatus: 'completed' }),
                    );
                },
                async markSkipped(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'skipped');
                    await publishSafe(
                        buildChannel['node-status']({ nodeId, nodeStatus: 'skipped' }),
                    );
                },
                async markFailed(nodeId) {
                    await updateNodeStatus(buildId, nodeId, 'failed', 'FAILED');
                    await publishSafe(
                        buildChannel['node-status']({ nodeId, nodeStatus: 'failed' }),
                    );
                },
            };

            const logger = createPipelineLogger(publishLog);

            const pipelineConfig = await prisma.pipelineConfig.findUnique({
                where: { repositoryId: config.repositoryId },
            });

            if (!pipelineConfig) {
                throw new Error(
                    `No pipeline configuration found for repository: ${config.repositoryId}`,
                );
            }

            const graph: PipelineGraph = {
                nodes: pipelineConfig.nodes as unknown as PipelineGraph['nodes'],
                edges: pipelineConfig.edges as unknown as PipelineGraph['edges'],
            };

            return await pipelineOrchestrator.execute(
                buildId,
                config,
                graph,
                step,
                logger,
                reporter,
                setStatus,
            );
        });
    },
);
