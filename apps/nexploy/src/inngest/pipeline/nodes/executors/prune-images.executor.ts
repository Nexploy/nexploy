import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { pruneImagesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class PruneImagesExecutor implements INodeExecutor {
    readonly type = 'prune-images';
    readonly configSchema = pruneImagesConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const filter = nodeConfig.filter as string | undefined;
        const olderThan = nodeConfig.olderThan as string | undefined;
        const dangling = (nodeConfig.dangling as boolean | undefined) ?? true;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

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

            const mb = ((result.reclaimedSpace ?? 0) / 1024 / 1024).toFixed(2);
            await logger.info(nodeId, `Pruned ${result.removedImages ?? 0} images, reclaimed ${mb} MB`);

            return {
                output: {
                    removedImages: result.removedImages ?? 0,
                    reclaimedSpace: result.reclaimedSpace ?? 0,
                },
            };
        } catch (error) {
            throw new Error(`Failed to prune images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const pruneImagesExecutor = new PruneImagesExecutor();
