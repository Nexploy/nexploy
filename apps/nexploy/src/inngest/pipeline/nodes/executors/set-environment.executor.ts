import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { setEnvironmentConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class SetEnvironmentExecutor implements INodeExecutor {
    readonly type = 'set-environment';
    readonly configSchema = setEnvironmentConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof setEnvironmentConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId } = ctx;

        const environmentId = nodeConfig.environmentId;

        await logger.info(nodeId, `Environment set: ${environmentId}`);

        return {
            output: { environmentId },
        };
    }
}

export const setEnvironmentExecutor = new SetEnvironmentExecutor();
