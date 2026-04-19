import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { deleteImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class DeleteImageExecutor implements INodeExecutor {
    readonly type = 'delete-image';
    readonly configSchema = deleteImageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof deleteImageConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const imageName = nodeConfig.imageName.trim();
        const force = nodeConfig.force;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Deleting Docker image: ${imageName}`);

        try {
            await kyDocker
                .post('images/delete', {
                    json: { imageIds: [imageName], force },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ deleted: string[] }>();

            await logger.info(nodeId, `Image deleted: ${imageName}`);

            return { output: { deletedImage: imageName } };
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('no such image') || msg.includes('not found')) {
                await logger.info(nodeId, `Image not found, skipping: ${imageName}`);
                return { output: { deletedImage: imageName }, skipped: true };
            }
            throw new Error(
                `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const deleteImageExecutor = new DeleteImageExecutor();
