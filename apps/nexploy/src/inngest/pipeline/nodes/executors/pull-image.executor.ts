import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { pullImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class PullImageExecutor implements INodeExecutor {
    readonly type = 'pull-image';
    readonly configSchema = pullImageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof pullImageConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const imageName = nodeConfig.imageName;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Pulling image: ${imageName}`);

        try {
            await kyDocker
                .post('images/pull', {
                    json: { imageName },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json();
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('already') || msg.includes('existe')) {
                await logger.info(nodeId, `Image already exists locally: ${imageName}`);
                return { output: { imageName }, skipped: true };
            }
            throw new Error(
                `Failed to pull image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }

        await logger.info(nodeId, `Image pulled successfully: ${imageName}`);

        return {
            output: { imageName },
        };
    }
}

export const pullImageExecutor = new PullImageExecutor();
