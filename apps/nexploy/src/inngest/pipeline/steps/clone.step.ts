import { BaseStep } from './base.step';
import { StepExecutionContext, StepMetadata, StepResult } from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';

export interface CloneStepResult {
    workDir: string;
}

export class CloneStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'clone-repository',
        name: 'Clone Repository',
        description: 'Clone the git repository from the remote source',
        retryable: true,
        timeout: 300000,
    };

    async execute(ctx: StepExecutionContext): Promise<StepResult<CloneStepResult>> {
        const { config } = ctx.context;

        const commitInfo = config.gitCommitHash
            ? ` (commit: ${config.gitCommitHash.substring(0, 7)})`
            : '';
        await ctx.logger.info(
            this.metadata.id,
            `Cloning repository ${config.gitUrl} (branch: ${config.gitBranch}${commitInfo})`,
        );

        try {
            const onProgress = async (progress: number, message: string) => {
                await ctx.logger.info(this.metadata.id, `${message} (${Math.round(progress)}%)`);
            };

            const workDir = await gitService.cloneRepository(config, onProgress);

            ctx.context.workDir = workDir;

            if (config.gitCommitHash) {
                await ctx.logger.info(
                    this.metadata.id,
                    `Checked out commit ${config.gitCommitHash.substring(0, 7)}`,
                );
            }

            await ctx.logger.info(this.metadata.id, 'Repository cloned successfully');

            return this.success({ workDir });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clone repository: ${message}`);
        }
    }
}

export const cloneStep = new CloneStep();
