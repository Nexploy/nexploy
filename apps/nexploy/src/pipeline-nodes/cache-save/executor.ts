import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { cacheSaveConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { z } from 'zod';

export class CacheSaveExecutor implements INodeExecutor {
    readonly type = 'cache-save';
    readonly configSchema = cacheSaveConfigSchema;

    async execute(ctx: NodeExecutionContext<z.infer<typeof cacheSaveConfigSchema>>): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const volumeName = nodeConfig.volumeName;
        const sourcePath = nodeConfig.sourcePath;
        const cacheKey = nodeConfig.cacheKey;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        if (!workDir) {
            await logger.warn(nodeId, 'No workDir found in pipeline outputs — skipping cache save');
            return { output: {}, skipped: true };
        }

        await logger.info(
            nodeId,
            `Saving cache ${sourcePath} → volume "${volumeName}"${cacheKey ? ` (key: ${cacheKey})` : ''}`,
        );

        try {
            const result = await ctx.services.docker
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
                })
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
