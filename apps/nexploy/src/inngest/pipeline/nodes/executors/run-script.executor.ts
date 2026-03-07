import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    getFromInputs,
} from '@/types/pipeline.type';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RunScriptExecutor implements INodeExecutor {
    readonly type = 'run-script';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { inputOutputs, logger, nodeId, nodeConfig } = ctx;

        const workDir = getFromInputs<string>(inputOutputs, 'workDir');
        if (!workDir) {
            throw new Error('No workDir found in input nodes');
        }

        const script = (nodeConfig.script as string | undefined) ?? '';
        const timeout = (nodeConfig.timeout as number | undefined) ?? 60000;
        const failOnError = (nodeConfig.failOnError as boolean | undefined) !== false;

        if (!script.trim()) {
            await logger.info(nodeId, 'No script configured, skipping');
            return { success: true, output: {}, skipped: true };
        }

        await logger.info(nodeId, `Running script in ${workDir}`);

        try {
            const { stdout, stderr } = await execAsync(script, { cwd: workDir, timeout });

            if (stdout) {
                for (const line of stdout.split('\n').filter(Boolean)) {
                    await logger.info(nodeId, line);
                }
            }
            if (stderr) {
                for (const line of stderr.split('\n').filter(Boolean)) {
                    await logger.warn(nodeId, line);
                }
            }

            await logger.info(nodeId, 'Script completed successfully');
            return {
                success: true,
                output: { stdout, stderr, exitCode: 0 },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (failOnError) {
                throw new Error(`Script failed: ${message}`);
            }
            await logger.warn(nodeId, `Script failed (continuing): ${message}`);
            return {
                success: true,
                output: { exitCode: 1, error: message },
            };
        }
    }
}

export const runScriptExecutor = new RunScriptExecutor();
