import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { pruneVolumesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class PruneVolumesExecutor implements INodeExecutor {
    readonly type = 'prune-volumes';
    readonly configSchema = pruneVolumesConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof pruneVolumesConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const all = nodeConfig.all ?? false;
        const filter = nodeConfig.filter;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(
            nodeId,
            `Pruning unused volumes (all: ${all}${filter ? `, filter: ${filter}` : ''})`,
        );

        try {
            const result = await kyDocker
                .post('volumes/prune', {
                    json: {
                        all,
                        ...(filter && { filter }),
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ removedVolumes: number; reclaimedSpace: number }>();

            const mb = (result.reclaimedSpace / 1024 / 1024).toFixed(2);
            await logger.info(nodeId, `Pruned ${result.removedVolumes} volumes, reclaimed ${mb} MB`);

            return {
                output: {
                    removedVolumes: result.removedVolumes,
                    reclaimedSpace: result.reclaimedSpace,
                },
            };
        } catch (error) {
            throw new Error(
                `Failed to prune volumes: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const pruneVolumesExecutor = new PruneVolumesExecutor();
