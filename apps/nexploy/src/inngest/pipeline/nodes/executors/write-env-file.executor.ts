import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';

export class WriteEnvFileExecutor implements INodeExecutor {
    readonly type = 'write-env-file';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, allOutputs, logger, nodeId } = ctx;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const envVariables: Record<string, string> = config.envVariables;

        const envCount = Object.keys(envVariables).length;

        if (envCount === 0) {
            await logger.info(nodeId, 'No environment variables to write');
            return { output: {}, skipped: true };
        }

        await logger.info(nodeId, `Writing ${envCount} environment variables`);

        try {
            await gitService.writeEnvFile(workDir, envVariables);
            await logger.info(nodeId, 'Environment file written successfully');
            return { output: {} };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to write environment file: ${message}`);
        }
    }
}

export const writeEnvFileExecutor = new WriteEnvFileExecutor();
