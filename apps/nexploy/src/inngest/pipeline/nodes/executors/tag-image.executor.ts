import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { tagImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class TagImageExecutor implements INodeExecutor {
    readonly type = 'tag-image';
    readonly configSchema = tagImageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof tagImageConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const sourceImage = nodeConfig.sourceImage;
        const sourceTag = nodeConfig.sourceTag;
        const targetTag = nodeConfig.targetTag;

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');
        const source = `${sourceImage}:${sourceTag}`;

        await logger.info(nodeId, `Tagging image ${source} → ${sourceImage}:${targetTag}`);

        try {
            await kyDocker
                .post('images/tag', {
                    json: {
                        sourceImage,
                        sourceTag,
                        targetTag,
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json();

            await logger.info(nodeId, `Image tagged as ${sourceImage}:${targetTag}`);
            return {
                output: {
                    sourceImage,
                    sourceTag,
                    targetTag,
                    taggedImage: `${sourceImage}:${targetTag}`,
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
