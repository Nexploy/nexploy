import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { setEnvironmentConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { z } from 'zod';

export class SetEnvironmentExecutor implements INodeExecutor {
    readonly type = 'set-environment';
    readonly configSchema = setEnvironmentConfigSchema;

    async execute(ctx: NodeExecutionContext<z.infer<typeof setEnvironmentConfigSchema>>): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId } = ctx;

        const environmentId = nodeConfig.environmentId;

        await logger.info(nodeId, `Environment set: ${environmentId}`);

        return {
            output: { environmentId },
        };
    }
}

export const setEnvironmentExecutor = new SetEnvironmentExecutor();
