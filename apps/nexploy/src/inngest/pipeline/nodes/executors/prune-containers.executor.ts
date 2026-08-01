import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { pruneContainersConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class PruneContainersExecutor implements INodeExecutor {
    readonly type = 'prune-containers';
    readonly configSchema = pruneContainersConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof pruneContainersConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const filter = nodeConfig.filter;
        const olderThan = nodeConfig.olderThan;

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(
            nodeId,
            `Pruning stopped containers${olderThan ? ` (older than: ${olderThan})` : ''}${filter ? ` (filter: ${filter})` : ''}`,
        );

        try {
            const result = await kyDocker
                .post('containers/prune', {
                    json: {
                        ...(filter && { filter }),
                        ...(olderThan && { olderThan }),
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ removedContainers: number; reclaimedSpace: number }>();

            const mb = (result.reclaimedSpace / 1024 / 1024).toFixed(2);
            await logger.info(nodeId, `Pruned ${result.removedContainers} containers, reclaimed ${mb} MB`);

            return {
                output: {
                    removedContainers: result.removedContainers,
                    reclaimedSpace: result.reclaimedSpace,
                },
            };
        } catch (error) {
            throw new Error(`Failed to prune containers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const pruneContainersExecutor = new PruneContainersExecutor();
