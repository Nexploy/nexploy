import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { tagImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class TagImageExecutor implements INodeExecutor {
    readonly type = 'tag-image';
    readonly configSchema = tagImageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof tagImageConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const sourceImage = nodeConfig.sourceImage.trim();
        const targetTag = nodeConfig.targetTag.trim();

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        const colonIndex = sourceImage.lastIndexOf(':');
        const repo = colonIndex !== -1 ? sourceImage.slice(0, colonIndex) : sourceImage;

        await logger.info(nodeId, `Tagging image ${sourceImage} → ${repo}:${targetTag}`);

        try {
            await ctx.services.docker
                .post(`images/${encodeURIComponent(sourceImage)}/tag`, {
                    json: { repo, tag: targetTag },
                    signal: abortSignal,
                    environmentId,
                })
                .json();

            await logger.info(nodeId, `Image tagged as ${repo}:${targetTag}`);
            return {
                output: {
                    sourceImage,
                    targetTag,
                    taggedImage: `${repo}:${targetTag}`,
                },
            };
        } catch (error) {
            throw new Error(`Failed to tag image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const tagImageExecutor = new TagImageExecutor();
