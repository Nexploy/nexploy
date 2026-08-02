import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { createVolumeConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { z } from 'zod';

export class CreateVolumeExecutor implements INodeExecutor {
    readonly type = 'create-volume';
    readonly configSchema = createVolumeConfigSchema;

    async execute(ctx: NodeExecutionContext<z.infer<typeof createVolumeConfigSchema>>): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const name = nodeConfig.name;
        const driver = nodeConfig.driver;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Creating Docker volume: ${name}`);

        try {
            const result = await ctx.services.docker
                .post('volumes/create', {
                    json: { name, ...(driver && { driver }) },
                    signal: abortSignal,
                    environmentId,
                })
                .json<{ volumeName: string }>();

            await logger.info(nodeId, `Volume created: ${result.volumeName}`);

            return {
                output: { volumeName: result.volumeName },
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('already') || msg.includes('existe')) {
                await logger.info(nodeId, `Volume already exists: ${name}`);
                return { output: { volumeName: name }, skipped: true };
            }
            throw new Error(`Failed to create volume: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const createVolumeExecutor = new CreateVolumeExecutor();
