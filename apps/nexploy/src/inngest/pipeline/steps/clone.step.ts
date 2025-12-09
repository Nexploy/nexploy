import { BaseStep } from './base.step';
import { StepExecutionContext, StepMetadata, StepResult } from '../types';
import { gitService } from '@/inngest/pipeline';

export interface CloneStepResult {
    workDir: string;
}

/**
 * Clone Repository Step
 * Clones the git repository to a temporary directory
 */
export class CloneStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'clone-repository',
        name: 'Clone Repository',
        description: 'Clone the git repository from the remote source',
        retryable: true,
        timeout: 300000, // 5 minutes
    };

    async execute(ctx: StepExecutionContext): Promise<StepResult<CloneStepResult>> {
        const { config } = ctx.context;

        await ctx.logger.info(this.metadata.id, `Cloning repository ${config.gitUrl}`);

        try {
            const onProgress = async (progress: number, message: string) => {
                await ctx.logger.info(this.metadata.id, `${message} (${Math.round(progress)}%)`);
            };

            const workDir = await gitService.cloneRepository(config, onProgress);

            // Update context with work directory
            ctx.context.workDir = workDir;

            await ctx.logger.info(this.metadata.id, 'Repository cloned successfully');

            return this.success({ workDir });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clone repository: ${message}`);
        }
    }
}

export const cloneStep = new CloneStep();
