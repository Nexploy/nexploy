import { BaseStep } from './base.step';
import { StepExecutionContext, StepMetadata, StepResult } from '../types';

export class FinalizeStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'finalize-logs',
        name: 'Finalize',
        description: 'Mark build as completed and finalize logs',
        retryable: false,
        timeout: 30000,
    };

    async execute(ctx: StepExecutionContext): Promise<StepResult> {
        await ctx.logger.info(this.metadata.id, 'Build pipeline completed successfully');
        await ctx.reporter.setStatus('COMPLETED');

        return this.success({
            imageId: ctx.context.imageId,
            containerId: ctx.context.containerId,
            projectName: ctx.context.projectName,
        });
    }
}

export const finalizeStep = new FinalizeStep();
