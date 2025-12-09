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
import {
    createPipelineLogger,
    createStatusReporter,
    LogLevel,
    pipelineOrchestrator,
    PipelineStatus,
    StepId,
} from '@/inngest/pipeline';

/**
 * Create a build channel for real-time updates via Inngest Realtime
 */
const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('status').type<{ status: string }>());
    return channelDef();
};

/**
 * Main build pipeline function
 *
 * Uses a modular Strategy pattern architecture:
 * - PipelineOrchestrator manages execution flow
 * - Build strategies (Dockerfile, Docker Compose, etc.) define step sequences
 * - Steps are modular and reusable across strategies
 *
 * @see /src/inngest/pipeline/ for the full architecture
 */
export const buildFunction = inngest.createFunction(
    {
        id: 'build-pipeline',
        cancelOn: [{ event: 'build/cancel', if: 'event.data.buildId == async.data.buildId' }],
        retries: 0,
    },
    { event: 'build/start' },
    async ({ event, step, publish }) => {
        const { buildId, config } = event.data as { buildId: string; config: BuildConfig };

        const buildChannel = createBuildChannel(buildId);

        // Create log publisher - broadcasts to realtime channel and persists to database
        // Note: publish() automatically detects if it's inside a step and won't create nested steps
        // When called from within step.run(), it executes directly without creating a new step
        const publishLog = async (stepName: string, message: string, level: LogLevel) => {
            const log: BuildLogEntry = {
                level,
                buildId,
                createdAt: new Date(),
                step: stepName,
                message,
            };

            // Persist to database (direct call, no Inngest step)
            await createLogInngest(log);

            // Publish to realtime channel
            // When inside a step.run(), publish() executes directly without creating a new step
            await publish(buildChannel.log({ log }));
        };

        // Create status publisher - broadcasts to realtime channel and updates database
        const publishStatus = async (status: PipelineStatus) => {
            // Update database (direct call, no Inngest step)
            await updateStatusBuildInngest(buildId, status as BuildStatus);

            // Publish to realtime channel
            await publish(buildChannel.status({ status }));
        };

        // Create step completion tracker
        const markStepCompleted = async (stepId: StepId) => {
            await updateLastCompletedStepInngest(buildId, stepId as any);
        };

        // Create adapters for the pipeline
        const logger = createPipelineLogger(publishLog);
        const reporter = createStatusReporter(publishStatus, markStepCompleted);

        // Execute the pipeline using the orchestrator
        // The orchestrator will:
        // 1. Select the appropriate strategy based on config.buildType
        // 2. Get the ordered list of steps for that strategy
        // 3. Execute each step, handling resume from failed step
        // 4. Return the final result

        return await pipelineOrchestrator.execute(buildId, config, step, logger, reporter);
    },
);
