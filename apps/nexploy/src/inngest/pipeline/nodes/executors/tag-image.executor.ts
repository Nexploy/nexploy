import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
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

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        const colonIndex = sourceImage.lastIndexOf(':');
        const repo = colonIndex !== -1 ? sourceImage.slice(0, colonIndex) : sourceImage;

        await logger.info(nodeId, `Tagging image ${sourceImage} → ${repo}:${targetTag}`);

        try {
            await kyDocker
                .post(`images/${encodeURIComponent(sourceImage)}/tag`, {
                    json: { repo, tag: targetTag },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
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
            throw new Error(
                `Failed to tag image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const tagImageExecutor = new TagImageExecutor();
