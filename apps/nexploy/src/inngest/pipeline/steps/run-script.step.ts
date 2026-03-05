import { BaseStep } from './base.step';
import { StepExecutionContext, StepMetadata, StepResult } from '@/types/pipeline.type';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RunScriptStep extends BaseStep {
    readonly metadata: StepMetadata;
    private readonly script: string;
    private readonly failOnError: boolean;
    private readonly stepTimeout: number;

    constructor(nodeId: string, script: string, timeout: number, failOnError: boolean) {
        super();
        this.script = script;
        this.failOnError = failOnError;
        this.stepTimeout = timeout;
        this.metadata = {
            id: `run-script-${nodeId}`,
            name: 'Run Script',
            description: 'Execute a shell script',
            retryable: false,
            timeout,
        };
    }

    async execute(ctx: StepExecutionContext): Promise<StepResult> {
        const { workDir } = ctx.context;

        if (!workDir) {
            throw new Error('Work directory not set');
        }

        await ctx.logger.info(this.metadata.id, `Running script in ${workDir}`);

        try {
            const { stdout, stderr } = await execAsync(this.script, {
                cwd: workDir,
                timeout: this.stepTimeout,
            });

            if (stdout) {
                for (const line of stdout.split('\n').filter(Boolean)) {
                    await ctx.logger.info(this.metadata.id, line);
                }
            }

            if (stderr) {
                for (const line of stderr.split('\n').filter(Boolean)) {
                    await ctx.logger.warn(this.metadata.id, line);
                }
            }

            await ctx.logger.info(this.metadata.id, 'Script completed successfully');
            return this.success();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (this.failOnError) {
                throw new Error(`Script failed: ${message}`);
            }
            await ctx.logger.warn(this.metadata.id, `Script failed (continuing): ${message}`);
            return this.success();
        }
    }
}
