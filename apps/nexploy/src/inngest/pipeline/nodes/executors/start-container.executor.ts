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

export class StartContainerExecutor implements INodeExecutor {
    readonly type = 'start-container';
    readonly configSchema = containerActionConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof containerActionConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerId = nodeConfig.containerId;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const opts = { signal: abortSignal, environmentId } as KyDockerOptions;

        await logger.info(nodeId, `Starting container: ${containerId}`);

        const warning = await runDockerAction(
            () => kyDocker.post(`container/${containerId}/start`, opts),
            logger,
            nodeId,
            { containerId },
        );
        if (warning) return warning;

        await logger.info(nodeId, `Container started: ${containerId}`);
        return { output: { containerId } };
    }
}

export const startContainerExecutor = new StartContainerExecutor();
