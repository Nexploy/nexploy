import { BaseStep } from './base.step';
import { StepMetadata, StepExecutionContext, StepResult } from '../types';
import { gitService } from '../services/git.service';

/**
 * Cleanup Step
 * Removes temporary files and directories created during the build
 */
export class CleanupStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'cleanup',
        name: 'Cleanup',
        description: 'Remove temporary files and directories',
        retryable: false,
        timeout: 60000, // 1 minute
    };

    async execute(ctx: StepExecutionContext): Promise<StepResult> {
        const { workDir } = ctx.context;

        if (!workDir) {
            await ctx.logger.info(this.metadata.id, 'No work directory to clean up');
            return this.skipped();
        }

        try {
            await gitService.cleanup(workDir);
            await ctx.logger.info(this.metadata.id, 'Cleanup completed');
            return this.success();
        } catch (error) {
            // Cleanup errors are not critical - log but don't fail
            await ctx.logger.warn(
                this.metadata.id,
                `Cleanup warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return this.success();
        }
    }
}

export const cleanupStep = new CleanupStep();
