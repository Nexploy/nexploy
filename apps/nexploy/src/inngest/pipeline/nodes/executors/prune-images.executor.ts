import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { pruneImagesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class PruneImagesExecutor implements INodeExecutor {
    readonly type = 'prune-images';
    readonly configSchema = pruneImagesConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof pruneImagesConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const filter = nodeConfig.filter;
        const olderThan = nodeConfig.olderThan;
        const dangling = nodeConfig.dangling ?? true;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(
            nodeId,
            `Pruning Docker images (dangling: ${dangling}${olderThan ? `, older than: ${olderThan}` : ''}${filter ? `, filter: ${filter}` : ''})`,
        );

        try {
            const result = await kyDocker
                .post('images/prune', {
                    json: {
                        dangling,
                        ...(filter && { filter }),
                        ...(olderThan && { olderThan }),
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ reclaimedSpace: number; removedImages: number }>();

            const mb = (result.reclaimedSpace / 1024 / 1024).toFixed(2);
            await logger.info(nodeId, `Pruned ${result.removedImages} images, reclaimed ${mb} MB`);

            return {
                output: {
                    removedImages: result.removedImages,
                    reclaimedSpace: result.reclaimedSpace,
                },
            };
        } catch (error) {
            throw new Error(
                `Failed to prune images: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const pruneImagesExecutor = new PruneImagesExecutor();
