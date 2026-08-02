import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { restartContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { HTTPError } from 'ky';
import { z } from 'zod';

export class RestartContainerExecutor implements INodeExecutor {
    readonly type = 'restart-container';
    readonly configSchema = restartContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof restartContainerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerId = nodeConfig.containerId;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');
        const opts = { signal: abortSignal, environmentId };

        await logger.info(nodeId, `Restarting container: ${containerId}`);

        try {
            await ctx.services.docker.post('container/restart', { ...opts, json: { containerIds: [containerId] } });
        } catch (error) {
            if (error instanceof HTTPError && error.response.status === 409) {
                await logger.warn(nodeId, error.message);
                return { output: { containerId } };
            }
            throw error;
        }

        await logger.info(nodeId, `Container restarted: ${containerId}`);
        return { output: { containerId } };
    }
}

export const restartContainerExecutor = new RestartContainerExecutor();
