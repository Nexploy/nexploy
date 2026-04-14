import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    ResolvedConfig,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { createVolumeConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CreateVolumeExecutor implements INodeExecutor {
    readonly type = 'create-volume';
    readonly configSchema = createVolumeConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolvedConfig<z.infer<typeof createVolumeConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const name = nodeConfig.name;
        const driver = nodeConfig.driver;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Creating Docker volume: ${name}`);

        try {
            const result = await kyDocker
                .post('volumes/create', {
                    json: { name, ...(driver && { driver }) },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
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
            throw new Error(
                `Failed to create volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const createVolumeExecutor = new CreateVolumeExecutor();
