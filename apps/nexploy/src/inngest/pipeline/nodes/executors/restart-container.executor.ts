import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { runDockerAction } from '@/inngest/pipeline/utils/dockerAction';
import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class RestartContainerExecutor implements INodeExecutor {
    readonly type = 'restart-container';
    readonly configSchema = containerActionConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerId = nodeConfig.containerId as string;
        if (!containerId) throw new Error('Container ID is required');

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const opts = { signal: abortSignal, environmentId } as KyDockerOptions;

        await logger.info(nodeId, `Restarting container: ${containerId}`);

        const warning = await runDockerAction(
            () => kyDocker.post(`container/${containerId}/restart`, opts),
            logger, nodeId, { containerId },
        );
        if (warning) return warning;

        await logger.info(nodeId, `Container restarted: ${containerId}`);
        return { success: true, output: { containerId } };
    }
}

export const restartContainerExecutor = new RestartContainerExecutor();
