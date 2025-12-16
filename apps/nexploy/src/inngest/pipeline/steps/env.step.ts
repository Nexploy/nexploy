import { BaseStep } from './base.step';
import { StepExecutionContext, StepMetadata, StepResult } from '../types';
import { gitService } from '../services/git.service';

export class EnvStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'write-env-file',
        name: 'Write Environment File',
        description: 'Write environment variables to .env.production',
        retryable: false,
        timeout: 30000,
    };

    async execute(ctx: StepExecutionContext): Promise<StepResult> {
        const { config, workDir } = ctx.context;

        if (!workDir) {
            throw new Error('Work directory not set - clone step must run first');
        }

        const envCount = Object.keys(config.envVariables).length;

        if (envCount === 0) {
            await ctx.logger.info(this.metadata.id, 'No environment variables to write');
            return this.skipped();
        }

        await ctx.logger.info(this.metadata.id, `Writing ${envCount} environment variables`);

        try {
            await gitService.writeEnvFile(workDir, config.envVariables);
            await ctx.logger.info(this.metadata.id, 'Environment file written successfully');
            return this.success();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to write environment file: ${message}`);
        }
    }
}

export const envStep = new EnvStep();
