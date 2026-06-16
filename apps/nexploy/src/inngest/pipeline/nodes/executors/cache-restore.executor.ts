import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { cacheRestoreConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class CacheRestoreExecutor implements INodeExecutor {
    readonly type = 'cache-restore';
    readonly configSchema = cacheRestoreConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof cacheRestoreConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const volumeName = nodeConfig.volumeName;
        const cachePath = nodeConfig.cachePath;
        const cacheKey = nodeConfig.cacheKey;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        if (!workDir) {
            await logger.warn(
                nodeId,
                'No workDir found in pipeline outputs — skipping cache restore',
            );
            return { output: {}, skipped: true };
        }

        await logger.info(
            nodeId,
            `Restoring cache from volume "${volumeName}" → ${cachePath}${cacheKey ? ` (key: ${cacheKey})` : ''}`,
        );

        try {
            const result = await kyDocker
                .post('volumes/cache/restore', {
                    json: {
                        volumeName,
                        cachePath,
                        workDir,
                        ...(cacheKey && { cacheKey }),
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ restored: boolean; sizeBytes?: number }>();

            if (result.restored) {
                const mb = ((result.sizeBytes ?? 0) / 1024 / 1024).toFixed(2);
                await logger.info(nodeId, `Cache restored (${mb} MB)`);
            } else {
                await logger.info(nodeId, 'No cache found — starting fresh');
            }

            return { output: {} };
        } catch (error) {
            await logger.warn(
                nodeId,
                `Cache restore failed (continuing): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return { output: { error: true }, skipped: false };
        }
    }
}

export const cacheRestoreExecutor = new CacheRestoreExecutor();
