import { BuildType } from '@workspace/typescript-interface/inngest/build';
import { IPipelineStep, StepMetadata, StepExecutionContext, StepResult } from '../types';

/**
 * Base abstract class for pipeline steps
 * Provides common functionality and enforces step contract
 */
export abstract class BaseStep implements IPipelineStep {
    abstract readonly metadata: StepMetadata;

    /**
     * Build types this step applies to
     * Override in subclass to restrict to specific build types
     * Default: applies to all build types
     */
    protected readonly applicableBuildTypes: readonly BuildType[] | 'all' = 'all';

    /**
     * Check if this step should run for the given build type
     */
    shouldRun(buildType: BuildType): boolean {
        if (this.applicableBuildTypes === 'all') {
            return true;
        }
        return this.applicableBuildTypes.includes(buildType);
    }

    /**
     * Execute the step - must be implemented by subclasses
     */
    abstract execute(ctx: StepExecutionContext): Promise<StepResult>;

    /**
     * Optional error handler - can be overridden by subclasses
     */
    async onError(ctx: StepExecutionContext, error: Error): Promise<void> {
        await ctx.logger.error(this.metadata.id, `Step failed: ${error.message}`);
    }

    /**
     * Helper to create a successful result
     */
    protected success<T>(data?: T): StepResult<T> {
        return { success: true, data };
    }

    /**
     * Helper to create a failed result
     */
    protected failure(error: Error): StepResult {
        return { success: false, error };
    }

    /**
     * Helper to create a skipped result
     */
    protected skipped(): StepResult {
        return { success: true, skipped: true };
    }

    /**
     * Check if the pipeline has been aborted
     */
    protected isAborted(ctx: StepExecutionContext): boolean {
        return ctx.context.abortController.signal.aborted;
    }

    /**
     * Throw if aborted - use in long-running operations
     */
    protected throwIfAborted(ctx: StepExecutionContext): void {
        if (this.isAborted(ctx)) {
            throw new DOMException('Pipeline aborted', 'AbortError');
        }
    }
}
