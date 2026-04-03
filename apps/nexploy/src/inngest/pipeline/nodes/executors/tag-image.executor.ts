import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { tagImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class TagImageExecutor implements INodeExecutor {
    readonly type = 'tag-image';
    readonly configSchema = tagImageConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const sourceImage = nodeConfig.sourceImage as string;
        const sourceTag = nodeConfig.sourceTag as string;
        const targetTag = nodeConfig.targetTag as string;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
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
                success: true,
                output: { sourceImage, sourceTag, targetTag, taggedImage: `${sourceImage}:${targetTag}` },
            };
        } catch (error) {
            throw new Error(`Failed to tag image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const tagImageExecutor = new TagImageExecutor();
