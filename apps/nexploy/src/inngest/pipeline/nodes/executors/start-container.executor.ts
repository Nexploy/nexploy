import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { startContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { HTTPError } from 'ky';
import { z } from 'zod';

export class StartContainerExecutor implements INodeExecutor {
    readonly type = 'start-container';
    readonly configSchema = startContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof startContainerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerId = nodeConfig.containerId;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const opts = { signal: abortSignal, environmentId } as KyDockerOptions;

        await logger.info(nodeId, `Starting container: ${containerId}`);

        try {
            await kyDocker.post(`container/${containerId}/start`, opts);
        } catch (error) {
            if (error instanceof HTTPError && error.response.status === 409) {
                await logger.warn(nodeId, error.message);
                return { output: { containerId } };
            }
            throw error;
        }

        await logger.info(nodeId, `Container started: ${containerId}`);
        return { output: { containerId } };
    }
}

export const startContainerExecutor = new StartContainerExecutor();
