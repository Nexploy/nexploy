import { channel, topic } from '@inngest/realtime';
import {
    BuildConfig,
    BuildLogEntry,
    BuildStatus,
} from '@workspace/typescript-interface/inngest/build';
import { inngest } from '@/inngest/client';
import {
    updateLastCompletedStepInngest,
    updateStatusBuildInngest,
} from '@/services/inngest/build.inngest.service';
import { createLogInngest } from '@/services/inngest/log.inngest.service';
import { LogLevel, PipelineStatus, StepId } from '@/inngest/pipeline/types';
import {
    createPipelineLogger,
    createStatusReporter,
    pipelineOrchestrator,
} from '@/inngest/pipeline/orchestrator';
import { runWithEnvironmentContextAsync } from '@/lib/environmentContext';

const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('status').type<{ status: string }>());
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
            console.log({ environmentId: config.environmentId });
            const buildChannel = createBuildChannel(buildId);

            const publishLog = async (stepName: string, message: string, level: LogLevel) => {
                const log: BuildLogEntry = {
                    level,
                    buildId,
                    createdAt: new Date(),
                    step: stepName,
                    message,
                };

                await createLogInngest(log);
                await publish(buildChannel.log({ log }));
            };

            const publishStatus = async (status: PipelineStatus) => {
                await updateStatusBuildInngest(buildId, status as BuildStatus);
                await publish(buildChannel.status({ status }));
            };

            const markStepCompleted = async (stepId: StepId) => {
                await updateLastCompletedStepInngest(buildId, stepId as any);
            };

            const logger = createPipelineLogger(publishLog);
            const reporter = createStatusReporter(publishStatus, markStepCompleted);

            return await pipelineOrchestrator.execute(buildId, config, step, logger, reporter);
        });
    },
);
