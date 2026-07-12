import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { pruneBuildCacheConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

const SIZE_UNITS: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
};

function parseKeepStorage(value: string): number {
    const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?$/i.exec(value.trim());

    if (!match?.[1]) {
        throw new Error(`Invalid keep storage value: "${value}" (expected e.g. 512MB, 10GB)`);
    }

    const unit = (match[2] ?? 'b').toLowerCase();
    return Math.floor(parseFloat(match[1]) * (SIZE_UNITS[unit] ?? 1));
}

export class PruneBuildCacheExecutor implements INodeExecutor {
    readonly type = 'prune-build-cache';
    readonly configSchema = pruneBuildCacheConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof pruneBuildCacheConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const all = nodeConfig.all ?? false;
        const filter = nodeConfig.filter;
        const keepStorage = nodeConfig.keepStorage
            ? parseKeepStorage(nodeConfig.keepStorage)
            : undefined;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(
            nodeId,
            `Pruning Docker build cache (all: ${all}${nodeConfig.keepStorage ? `, keep: ${nodeConfig.keepStorage}` : ''}${filter ? `, filter: ${filter}` : ''})`,
        );

        try {
            const result = await kyDocker
                .post('system/build-cache/prune', {
                    json: {
                        all,
                        ...(keepStorage !== undefined && { keepStorage }),
                        ...(filter && { filter }),
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ deletedCaches: number; reclaimedSpace: number }>();

            const mb = (result.reclaimedSpace / 1024 / 1024).toFixed(2);
            await logger.info(
                nodeId,
                `Pruned ${result.deletedCaches} build cache entries, reclaimed ${mb} MB`,
            );

            return {
                output: {
                    deletedCaches: result.deletedCaches,
                    reclaimedSpace: result.reclaimedSpace,
                },
            };
        } catch (error) {
            throw new Error(
                `Failed to prune build cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const pruneBuildCacheExecutor = new PruneBuildCacheExecutor();
