import { BuildConfig, BuildType } from '@workspace/typescript-interface/inngest/build';
import {
    IBuildStrategy,
    InngestStepRunner,
    IPipelineOrchestrator,
    LogLevel,
    PipelineLogger,
    PipelineResult,
    PipelineStatus,
    StatusReporter,
    StepId,
} from './types';
import { PipelineContext } from './context';
import { dockerComposeStrategy, dockerfileStrategy } from './strategies';
import { gitService } from '@/inngest/pipeline/services';

function formatErrorDetails(error: unknown): string {
    if (error instanceof Error) {
        const details = [`Error: ${error.message}`, `Name: ${error.name}`];

        if (error.stack) {
            details.push(`Stack trace:\n${error.stack}`);
        }

        const additionalProps = Object.entries(error)
            .filter(([key]) => !['message', 'name', 'stack'].includes(key))
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

        if (additionalProps.length > 0) {
            details.push(`Additional info:\n${additionalProps.join('\n')}`);
        }

        return details.join('\n');
    }

    return `Unknown error: ${JSON.stringify(error, null, 2)}`;
}

/**
 * Pipeline Orchestrator
 * Manages the execution of build pipelines using the Strategy pattern
 */
export class PipelineOrchestrator implements IPipelineOrchestrator {
    private strategies: Map<BuildType, IBuildStrategy> = new Map();

    constructor() {
        // Register default strategies
        this.registerStrategy(dockerfileStrategy);
        this.registerStrategy(dockerComposeStrategy);
    }

    /**
     * Register a build strategy
     */
    registerStrategy(strategy: IBuildStrategy): void {
        this.strategies.set(strategy.buildType, strategy);
    }

    /**
     * Get strategy for a build type
     */
    private getStrategy(buildType: BuildType): IBuildStrategy {
        const strategy = this.strategies.get(buildType);
        if (!strategy) {
            throw new Error(`No strategy registered for build type: ${buildType}`);
        }
        return strategy;
    }

    /**
     * Check if a step should be executed based on resume point
     */
    private shouldRunStep(stepId: StepId, allSteps: StepId[], startFromStep?: StepId): boolean {
        if (!startFromStep) return true;

        const startIndex = allSteps.indexOf(startFromStep);
        const stepIndex = allSteps.indexOf(stepId);

        return stepIndex >= startIndex;
    }

    /**
     * Execute the pipeline
     */
    async execute(
        buildId: string,
        config: BuildConfig,
        inngestStep: InngestStepRunner,
        logger: PipelineLogger,
        reporter: StatusReporter,
    ): Promise<PipelineResult> {
        const strategy = this.getStrategy(config.buildType);

        // Validate configuration
        strategy.validateConfig(config);

        // Create pipeline context
        const context = new PipelineContext(buildId, config, logger, reporter);

        // Get steps for this strategy
        const steps = strategy.getSteps();
        const stepIds = steps.map((s) => s.metadata.id);
        const completedSteps: StepId[] = [];

        try {
            // Initialize pipeline - wrapped in a step to avoid publish() step ID conflicts
            await inngestStep.run('pipeline-init', async () => {
                // Log resume info if applicable
                if (config.startFromStep) {
                    await logger.info(
                        'resume',
                        `Resuming build from step: ${config.startFromStep}`,
                    );
                }
                // Set initial status
                await reporter.setStatus('BUILDING');
            });

            // Execute each step
            for (const step of steps) {
                const stepId = step.metadata.id;

                // Check if step should run for this build type
                if (!step.shouldRun(config.buildType)) {
                    continue;
                }

                // Check if step should be skipped based on resume point
                if (!this.shouldRunStep(stepId, stepIds, config.startFromStep)) {
                    continue;
                }

                // Execute step using Inngest's step runner
                // Important: Inngest steps are isolated, so we need to return data
                // and manually sync it back to the context
                const stepResult = await inngestStep.run(stepId, async () => {
                    const stepContext = context.createStepContext();

                    try {
                        const result = await step.execute(stepContext);

                        if (!result.skipped) {
                            await reporter.markStepCompleted(stepId);
                        }

                        // Return both the result and any context updates
                        return {
                            result,
                            contextUpdates: {
                                workDir: stepContext.context.workDir,
                                imageId: stepContext.context.imageId,
                                containerId: stepContext.context.containerId,
                            },
                        };
                    } catch (error) {
                        // Call step's error handler if available
                        if (step.onError) {
                            await step.onError(
                                stepContext,
                                error instanceof Error ? error : new Error(String(error)),
                            );
                        }
                        throw error;
                    }
                });

                // Sync context updates from the step result
                if (stepResult && typeof stepResult === 'object') {
                    const { result, contextUpdates } = stepResult as {
                        result: { success: boolean; skipped?: boolean; data?: unknown };
                        contextUpdates: {
                            workDir?: string | null;
                            imageId?: string | null;
                            containerId?: string | null;
                        };
                    };

                    // Update context with values from the step
                    if (contextUpdates.workDir) context.workDir = contextUpdates.workDir;
                    if (contextUpdates.imageId) context.imageId = contextUpdates.imageId;
                    if (contextUpdates.containerId)
                        context.containerId = contextUpdates.containerId;

                    if (!result.skipped) {
                        context.setStepResult(stepId, result);
                    }

                    completedSteps.push(stepId);
                }
            }

            // Finalize pipeline - wrapped in a step to avoid publish() step ID conflicts
            await inngestStep.run('pipeline-complete', async () => {
                await reporter.setStatus('COMPLETED');
            });

            return {
                success: true,
                imageId: context.imageId || undefined,
                containerId: context.containerId || undefined,
                projectName: context.projectName || undefined,
                completedSteps,
            };
        } catch (error) {
            const errorDetails = formatErrorDetails(error);

            const workDirToClean = context.workDir;

            // Handle abort error
            if (error instanceof Error && error.name === 'AbortError') {
                await logger.info('cancel', 'Build cancelled by user');
                await reporter.setStatus('CANCELLED');

                // Cleanup on cancellation
                if (workDirToClean) {
                    try {
                        await gitService.cleanup(workDirToClean);
                    } catch (cleanupError) {
                        console.error('Cleanup failed after cancellation:', cleanupError);
                    }
                }

                return {
                    success: false,
                    error: 'Build cancelled',
                    completedSteps,
                };
            }

            // Handle all other errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Log the full error details
            await logger.error('error', `Build failed: ${errorMessage}`);
            await logger.error('error-details', errorDetails);

            // Set status to failed
            await reporter.setStatus('FAILED');

            // Cleanup on failure
            if (workDirToClean) {
                try {
                    await gitService.cleanup(workDirToClean);
                } catch (cleanupError) {
                    console.error('Cleanup failed after error:', cleanupError);
                    await logger.error(
                        'cleanup-error',
                        `Cleanup failed: ${formatErrorDetails(cleanupError)}`,
                    );
                }
            }

            // Throw the error to mark the Inngest function as failed
            throw error;
        }
    }
}

/**
 * Create a logger adapter for Inngest publish function
 */
export function createPipelineLogger(
    publishLog: (step: string, message: string, level: LogLevel) => Promise<void>,
): PipelineLogger {
    return {
        log: publishLog,
        debug: (step, message) => publishLog(step, message, 'DEBUG'),
        info: (step, message) => publishLog(step, message, 'INFO'),
        warn: (step, message) => publishLog(step, message, 'WARN'),
        error: (step, message) => publishLog(step, message, 'ERROR'),
    };
}

/**
 * Create a status reporter adapter
 */
export function createStatusReporter(
    setStatus: (status: PipelineStatus) => Promise<void>,
    markStepCompleted: (stepId: StepId) => Promise<void>,
): StatusReporter {
    return { setStatus, markStepCompleted };
}

// Export singleton instance
export const pipelineOrchestrator = new PipelineOrchestrator();
