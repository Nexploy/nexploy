import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { writeEnvFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class WriteEnvFileExecutor implements INodeExecutor {
    readonly type = 'write-env-file';
    readonly configSchema = writeEnvFileConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, allOutputs, logger, nodeId } = ctx;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const useRepositoryEnvVars =
            (ctx.nodeConfig.useRepositoryEnvVars as boolean | undefined) !== false;

        const envVariables: Record<string, string> = useRepositoryEnvVars
            ? config.envVariables
            : {};

        const envCount = Object.keys(envVariables).length;

        if (envCount === 0) {
            await logger.info(nodeId, 'No environment variables to write');
            return { success: true, output: {}, skipped: true };
        }

        await logger.info(nodeId, `Writing ${envCount} environment variables`);

        try {
            await gitService.writeEnvFile(workDir, envVariables);
            await logger.info(nodeId, 'Environment file written successfully');
            return { success: true, output: {} };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to write environment file: ${message}`);
        }
    }
}

export const writeEnvFileExecutor = new WriteEnvFileExecutor();
