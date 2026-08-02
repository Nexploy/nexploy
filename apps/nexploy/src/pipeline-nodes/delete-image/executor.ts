import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { deleteImageConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/pipeline-core/schemas/nodeFieldRef.schema';
import { z } from 'zod';
import { ImageDeleteResponse } from '@workspace/pipeline-core/hostResponses';

export class DeleteImageExecutor implements INodeExecutor {
    readonly type = 'delete-image';
    readonly configSchema = deleteImageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof deleteImageConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const imageId = nodeConfig.imageId.trim();
        const force = nodeConfig.force;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Deleting Docker image: ${imageId}`);

        const skipReasonToMessage: Record<string, string> = {
            in_use: `Image skipped (in use): ${imageId}`,
            not_found: `Image not found, skipping: ${imageId}`,
        };

        try {
            const result = await ctx.services.docker
                .post('images/delete', {
                    json: { imageIds: [imageId], force },
                    signal: abortSignal,
                    environmentId,
                })
                .json<ImageDeleteResponse>();

            if (result.skipped?.length) {
                for (const skipped of result.skipped) {
                    const message =
                        skipReasonToMessage[skipped.reason] ?? `Image skipped (${skipped.reason}): ${skipped.name}`;
                    await logger.warn(nodeId, message);
                }
                return { output: { deletedImageId: imageId }, skipped: true };
            }

            await logger.info(nodeId, `Image deleted: ${imageId}`);

            return { output: { deletedImageId: imageId } };
        } catch (error) {
            throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const deleteImageExecutor = new DeleteImageExecutor();
