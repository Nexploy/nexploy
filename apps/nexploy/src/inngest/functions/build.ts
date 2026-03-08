import { channel, topic } from '@inngest/realtime';
import dayjs from 'dayjs';
import {
    BuildConfig,
    BuildLogEntry,
    BuildStatus,
} from '@workspace/typescript-interface/inngest/build';
import { inngest } from '@/inngest/client';
import {
    updateNodeStatusInngest,
    updateStatusBuildInngest,
} from '@/services/inngest/build.inngest.service';
import { createLogInngest } from '@/services/inngest/log.inngest.service';
import { LogLevel, PipelineReporter, PipelineStatus } from '@/types/pipeline.type';
import { createPipelineLogger, nodePipelineOrchestrator } from '@/inngest/pipeline/orchestrator';
import { runWithEnvironmentContextAsync } from '@/lib/environmentContext';
import { prisma } from '../../../prisma/prisma';
import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';

const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('status').type<{ status: string }>())
        .addTopic(topic('node-status').type<{ nodeId: string; status: string }>());
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

            const setStatus = async (status: PipelineStatus) => {
                await updateStatusBuildInngest(buildId, status as BuildStatus);
            };

            const reporter: PipelineReporter = {
                async markRunning(nodeId) {
                    await updateNodeStatusInngest(buildId, nodeId, 'running');
                },
                async markCompleted(nodeId) {
                    await updateNodeStatusInngest(buildId, nodeId, 'completed');
                },
                async markSkipped(nodeId) {
                    await updateNodeStatusInngest(buildId, nodeId, 'skipped');
                },
                async markFailed(nodeId) {
                    await updateNodeStatusInngest(buildId, nodeId, 'failed');
                    await updateStatusBuildInngest(buildId, 'FAILED');
                },
            };

            const publishEvent = async (nodeId: string | null, status: string) => {
                try {
                    if (nodeId) {
                        await publish(buildChannel['node-status']({ nodeId, status }));
                    } else {
                        await publish(buildChannel.status({ status }));
                    }
                } catch { /* ignore */ }
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

            return await nodePipelineOrchestrator.execute(
                buildId,
                config,
                graph,
                step,
                logger,
                reporter,
                setStatus,
                publishEvent,
            );
        });
    },
);
