import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { deleteVolumeConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class DeleteVolumeExecutor implements INodeExecutor {
    readonly type = 'delete-volume';
    readonly configSchema = deleteVolumeConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof deleteVolumeConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const volumeName = nodeConfig.volumeName.trim();
        const force = nodeConfig.force;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Deleting Docker volume: ${volumeName}`);

        try {
            const url = force ? `volumes/delete?force=true` : `volumes/delete`;
            await kyDocker
                .post(url, {
                    json: { volumeNames: [volumeName] },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ deleted: string[] }>();

            await logger.info(nodeId, `Volume deleted: ${volumeName}`);

            return { output: { deletedVolume: volumeName } };
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('not found') || msg.includes('no such volume')) {
                await logger.info(nodeId, `Volume not found, skipping: ${volumeName}`);
                return { output: { deletedVolume: volumeName }, skipped: true };
            }
            throw new Error(
                `Failed to delete volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const deleteVolumeExecutor = new DeleteVolumeExecutor();
