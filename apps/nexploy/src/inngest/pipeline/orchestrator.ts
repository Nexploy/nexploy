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
} from '@/types/pipeline.type';
import { PipelineContext } from './context';
import { dockerfileStrategy } from '@/inngest/pipeline/strategies/dockerfile.strategy';
import { dockerComposeStrategy } from '@/inngest/pipeline/strategies/compose.strategy';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { prisma } from '../../../prisma/prisma';

function formatErrorDetails(error: unknown): string {
    if (error instanceof Error) {
        const details = [`Error: ${error.message}`, `Name: ${error.name}`];

        if (process.env.NODE_ENV !== 'production') {
            if (error.stack) {
                details.push(`Stack trace:\n${error.stack}`);
            }

            const additionalProps = Object.entries(error)
                .filter(([key]) => !['message', 'name', 'stack'].includes(key))
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

            if (additionalProps.length > 0) {
                details.push(`Additional info:\n${additionalProps.join('\n')}`);
            }
        }

        return details.join('\n');
    }

    return `Unknown error: ${JSON.stringify(error, null, 2)}`;
}

export class PipelineOrchestrator implements IPipelineOrchestrator {
    private strategies: Map<BuildType, IBuildStrategy> = new Map();

    constructor() {
        this.registerStrategy(dockerfileStrategy);
        this.registerStrategy(dockerComposeStrategy);
    }

    registerStrategy(strategy: IBuildStrategy): void {
        this.strategies.set(strategy.buildType, strategy);
    }

    private getStrategy(buildType: BuildType): IBuildStrategy {
        const strategy = this.strategies.get(buildType);
        if (!strategy) {
            throw new Error(`No strategy registered for build type: ${buildType}`);
        }
        return strategy;
    }

    private shouldRunStep(stepId: StepId, allSteps: StepId[], startFromStep?: StepId): boolean {
        if (!startFromStep) return true;

        const startIndex = allSteps.indexOf(startFromStep);
        const stepIndex = allSteps.indexOf(stepId);

        return stepIndex >= startIndex;
    }

    private startCancellationWatcher(
        buildId: string,
        context: PipelineContext,
        intervalMs = 2000,
    ): NodeJS.Timeout {
        return setInterval(async () => {
            if (context.isAborted()) return;

            try {
                const build = await prisma.build.findUnique({
                    where: { id: buildId },
                    select: { status: true },
                });

                if (build?.status === 'CANCELLED') {
                    context.abort();
                }
            } catch {
                /* empty */
            }
        }, intervalMs);
    }

    async execute(
        buildId: string,
        config: BuildConfig,
        inngestStep: InngestStepRunner,
        logger: PipelineLogger,
        reporter: StatusReporter,
    ): Promise<PipelineResult> {
        const strategy = this.getStrategy(config.buildType);

        strategy.validateConfig(config);

        const context = new PipelineContext(buildId, config, logger, reporter);

        const steps = strategy.getSteps();
        const stepIds = steps.map((s) => s.metadata.id);
        const completedSteps: StepId[] = [];

        const cancellationWatcher = this.startCancellationWatcher(buildId, context);

        try {
            await inngestStep.run('pipeline-init', async () => {
                if (config.startFromStep) {
                    await logger.info(
                        'resume',
                        `Resuming build from step: ${config.startFromStep}`,
                    );
                }
                await reporter.setStatus('BUILDING');
            });

            for (const step of steps) {
                const stepId = step.metadata.id;

                if (!step.shouldRun(config.buildType)) {
                    continue;
                }

                if (!this.shouldRunStep(stepId, stepIds, config.startFromStep)) {
                    continue;
                }

                const stepResult = await inngestStep.run(stepId, async () => {
                    if (context.isAborted()) {
                        throw new DOMException('Build cancelled', 'AbortError');
                    }

                    const stepContext = context.createStepContext();

                    try {
                        const timeoutMs = step.metadata.timeout;
                        const executePromise = step.execute(stepContext);
                        const result = await (timeoutMs
                            ? Promise.race([
                                  executePromise,
                                  new Promise<never>((_, reject) =>
                                      setTimeout(
                                          () =>
                                              reject(
                                                  new Error(
                                                      `Step "${stepId}" timed out after ${timeoutMs / 1000}s`,
                                                  ),
                                              ),
                                          timeoutMs,
                                      ),
                                  ),
                              ])
                            : executePromise);

                        if (!result.skipped) {
                            await reporter.markStepCompleted(stepId);
                        }

                        return {
                            result,
                            contextUpdates: {
                                workDir: stepContext.context.workDir,
                                imageId: stepContext.context.imageId,
                                containerId: stepContext.context.containerId,
                            },
                        };
                    } catch (error) {
                        if (step.onError) {
                            await step.onError(
                                stepContext,
                                error instanceof Error ? error : new Error(String(error)),
                            );
                        }
                        throw error;
                    }
                });

                if (stepResult && typeof stepResult === 'object') {
                    const { result, contextUpdates } = stepResult as {
                        result: { success: boolean; skipped?: boolean; data?: unknown };
                        contextUpdates: {
                            workDir?: string | null;
                            imageId?: string | null;
                            containerId?: string | null;
                        };
                    };

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

            if (error instanceof Error && error.name === 'AbortError') {
                await logger.info('cancel', 'Build cancelled by user');
                await reporter.setStatus('CANCELLED');

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

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            await logger.error('error', `Build failed: ${errorMessage}`);
            await logger.error('error-details', errorDetails);

            await reporter.setStatus('FAILED');

            if (workDirToClean) {
                try {
                    await gitService.cleanup(workDirToClean);
                } catch (cleanupError) {
                    await logger.error(
                        'cleanup-error',
                        `Cleanup failed: ${formatErrorDetails(cleanupError)}`,
                    );
                }
            }

            throw error;
        } finally {
            clearInterval(cancellationWatcher);
        }
    }
}

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

export function createStatusReporter(
    setStatus: (status: PipelineStatus) => Promise<void>,
    markStepCompleted: (stepId: StepId) => Promise<void>,
): StatusReporter {
    return { setStatus, markStepCompleted };
}

export const pipelineOrchestrator = new PipelineOrchestrator();
