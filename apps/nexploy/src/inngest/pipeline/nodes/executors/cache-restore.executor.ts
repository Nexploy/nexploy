import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { cacheRestoreConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CacheRestoreExecutor implements INodeExecutor {
    readonly type = 'cache-restore';
    readonly configSchema = cacheRestoreConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof cacheRestoreConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const volumeName = nodeConfig.volumeName;
        const cachePath = nodeConfig.cachePath;
        const cacheKey = nodeConfig.cacheKey;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        if (!workDir) {
            await logger.warn(
                nodeId,
                'No workDir found in pipeline outputs — skipping cache restore',
            );
            return { output: { restored: false }, skipped: true };
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
                    timeout: 120000,
                } as KyDockerOptions)
                .json<{ restored: boolean; files?: number }>();

            if (result.restored) {
                await logger.info(nodeId, `Cache restored (${result.files ?? 0} files)`);
            } else {
                await logger.info(nodeId, 'No cache found — starting fresh');
            }

            return {
                output: {
                    restored: result.restored,
                    files: result.files ?? 0,
                    volumeName,
                    cachePath,
                },
            };
        } catch (error) {
            await logger.warn(
                nodeId,
                `Cache restore failed (continuing): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return { output: { restored: false, error: true }, skipped: false };
        }
    }
}

export const cacheRestoreExecutor = new CacheRestoreExecutor();
