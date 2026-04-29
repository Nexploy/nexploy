import { getFromClosestAncestor } from '@/types/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

export class EnvVarsExecutor implements INodeExecutor {
    readonly type = 'env-vars';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { allOutputs, logger, nodeId, edges } = ctx;

        const envVariables =
            getFromClosestAncestor<Record<string, string>>(
                allOutputs,
                edges,
                nodeId,
                'envVariables',
            ) ?? {};

        const envCount = Object.keys(envVariables).length;

        if (envCount === 0) {
            await logger.info(nodeId, 'No environment variables to inject');
            return { output: {}, skipped: true };
        }

        await logger.info(nodeId, `Injecting ${envCount} environment variables`);

        return { output: { envVariables } };
    }
}

export const envVarsExecutor = new EnvVarsExecutor();
