import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { deleteContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { HTTPError } from 'ky';
import { z } from 'zod';

export class DeleteContainerExecutor implements INodeExecutor {
    readonly type = 'delete-container';
    readonly configSchema = deleteContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof deleteContainerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const { containerId, force } = nodeConfig;
        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );
        const opts = { signal: abortSignal, environmentId } as KyDockerOptions;

        await logger.info(nodeId, `Deleting container: ${containerId}`);

        try {
            await kyDocker.delete('container/remove', {
                ...opts,
                json: { containerIds: [containerId], force },
            });
        } catch (error) {
            if (error instanceof HTTPError && error.response.status === 409) {
                await logger.warn(nodeId, error.message);
                return { output: {} };
            }
            throw error;
        }

        await logger.info(nodeId, `Container deleted: ${containerId}`);
        return { output: {} };
    }
}

export const deleteContainerExecutor = new DeleteContainerExecutor();
