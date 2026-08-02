import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { removeContainerConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/pipeline-core/schemas/nodeFieldRef.schema';
import { HTTPError } from 'ky';
import { z } from 'zod';

export class RemoveContainerExecutor implements INodeExecutor {
    readonly type = 'remove-container';
    readonly configSchema = removeContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof removeContainerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerId = nodeConfig.containerId;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');
        const opts = { signal: abortSignal, environmentId };

        await logger.info(nodeId, `Removing container: ${containerId}`);

        try {
            await ctx.services.docker.delete('container/remove', { ...opts, json: { containerIds: [containerId] } });
        } catch (error) {
            if (error instanceof HTTPError && error.response.status === 409) {
                await logger.warn(nodeId, error.message);
                return { output: { containerId } };
            }
            throw error;
        }

        await logger.info(nodeId, `Container removed: ${containerId}`);
        return { output: { containerId } };
    }
}

export const removeContainerExecutor = new RemoveContainerExecutor();
