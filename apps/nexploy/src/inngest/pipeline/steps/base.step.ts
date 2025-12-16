import { BuildType } from '@workspace/typescript-interface/inngest/build';
import { IPipelineStep, StepExecutionContext, StepMetadata, StepResult } from '../types';

export abstract class BaseStep implements IPipelineStep {
    abstract readonly metadata: StepMetadata;

    protected readonly applicableBuildTypes: readonly BuildType[] | 'all' = 'all';

    shouldRun(buildType: BuildType): boolean {
        if (this.applicableBuildTypes === 'all') {
            return true;
        }
        return this.applicableBuildTypes.includes(buildType);
    }

    abstract execute(ctx: StepExecutionContext): Promise<StepResult>;

    async onError(ctx: StepExecutionContext, error: Error): Promise<void> {
        await ctx.logger.error(this.metadata.id, `Step failed: ${error.message}`);
    }

    protected success<T>(data?: T): StepResult<T> {
        return { success: true, data };
    }

    protected failure(error: Error): StepResult {
        return { success: false, error };
    }

    protected skipped(): StepResult {
        return { success: true, skipped: true };
    }

    protected isAborted(ctx: StepExecutionContext): boolean {
        return ctx.context.abortController.signal.aborted;
    }

    protected throwIfAborted(ctx: StepExecutionContext): void {
        if (this.isAborted(ctx)) {
            throw new DOMException('Pipeline aborted', 'AbortError');
        }
    }
}
