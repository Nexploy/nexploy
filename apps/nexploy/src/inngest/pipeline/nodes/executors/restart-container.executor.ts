import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class RestartContainerExecutor implements INodeExecutor {
    readonly type = 'restart-container';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerId = nodeConfig.containerId as string;
        if (!containerId) throw new Error('Container ID is required');

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Restarting container: ${containerId}`);

        await kyDocker.post(`container/${containerId}/restart`, {
            signal: abortSignal,
            environmentId,
        } as KyDockerOptions);

        await logger.info(nodeId, `Container restarted: ${containerId}`);

        return {
            success: true,
            output: { containerId },
        };
    }
}

export const restartContainerExecutor = new RestartContainerExecutor();
