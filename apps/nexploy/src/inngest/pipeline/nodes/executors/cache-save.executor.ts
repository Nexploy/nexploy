import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { cacheSaveConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CacheSaveExecutor implements INodeExecutor {
    readonly type = 'cache-save';
    readonly configSchema = cacheSaveConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof cacheSaveConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const volumeName = nodeConfig.volumeName;
        const sourcePath = nodeConfig.sourcePath;
        const cacheKey = nodeConfig.cacheKey;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        if (!workDir) {
            await logger.warn(nodeId, 'No workDir found in pipeline outputs — skipping cache save');
            return { output: {}, skipped: true };
        }

        await logger.info(
            nodeId,
            `Saving cache ${sourcePath} → volume "${volumeName}"${cacheKey ? ` (key: ${cacheKey})` : ''}`,
        );

        try {
            const result = await kyDocker
                .post('volumes/cache/save', {
                    json: {
                        volumeName,
                        sourcePath,
                        workDir,
                        ...(cacheKey && { cacheKey }),
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 120000,
                } as KyDockerOptions)
                .json<{ sizeBytes?: number }>();

            const mb = ((result.sizeBytes ?? 0) / 1024 / 1024).toFixed(2);
            await logger.info(nodeId, `Cache saved (${mb} MB)`);

            return { output: {} };
        } catch (error) {
            await logger.warn(
                nodeId,
                `Cache save failed (continuing): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return { output: { error: true }, skipped: false };
        }
    }
}

export const cacheSaveExecutor = new CacheSaveExecutor();
