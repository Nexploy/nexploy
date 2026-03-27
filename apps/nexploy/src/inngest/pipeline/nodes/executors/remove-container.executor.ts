import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class RemoveContainerExecutor implements INodeExecutor {
    readonly type = 'remove-container';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerId = nodeConfig.containerId as string;
        if (!containerId) throw new Error('Container ID is required');

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Removing container: ${containerId}`);

        await kyDocker.delete(`container/${containerId}/remove`, {
            signal: abortSignal,
            environmentId,
        } as KyDockerOptions);

        await logger.info(nodeId, `Container removed: ${containerId}`);

        return {
            success: true,
            output: { containerId },
        };
    }
}

export const removeContainerExecutor = new RemoveContainerExecutor();
