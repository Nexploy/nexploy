import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { getAllEnvsBuild } from '@/services/repository/build.service';

export class EnvVarsExecutor implements INodeExecutor {
    readonly type = 'env-vars';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { logger, nodeId, buildConfig } = ctx;
        const envVariables = await getAllEnvsBuild(buildConfig.repositoryId);

        if (envVariables.length === 0) {
            await logger.info(nodeId, 'No environment variables to inject');
            return { output: {}, skipped: true };
        }

        await logger.info(nodeId, `Injecting ${envVariables.length} environment variables`);

        return { output: { envVariables } };
    }
}

export const envVarsExecutor = new EnvVarsExecutor();
