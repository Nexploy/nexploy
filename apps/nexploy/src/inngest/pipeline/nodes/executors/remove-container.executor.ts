import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { runDockerAction } from '@/inngest/pipeline/utils/dockerAction';
import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class RemoveContainerExecutor implements INodeExecutor {
    readonly type = 'remove-container';
    readonly configSchema = containerActionConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof containerActionConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerId = nodeConfig.containerId;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const opts = { signal: abortSignal, environmentId } as KyDockerOptions;

        await logger.info(nodeId, `Removing container: ${containerId}`);

        const warning = await runDockerAction(
            () => kyDocker.delete(`container/${containerId}/remove`, opts),
            logger,
            nodeId,
            { containerId },
        );
        if (warning) return warning;

        await logger.info(nodeId, `Container removed: ${containerId}`);
        return { output: { containerId } };
    }
}

export const removeContainerExecutor = new RemoveContainerExecutor();
