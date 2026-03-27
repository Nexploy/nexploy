import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class CreateVolumeExecutor implements INodeExecutor {
    readonly type = 'create-volume';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const name = nodeConfig.name as string;
        if (!name) throw new Error('Volume name is required');

        const driver = nodeConfig.driver as string | undefined;
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
                success: true,
                output: { volumeName: result.volumeName },
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('already') || msg.includes('existe')) {
                await logger.info(nodeId, `Volume already exists: ${name}`);
                return { success: true, output: { volumeName: name }, skipped: true };
            }
            throw new Error(`Failed to create volume: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const createVolumeExecutor = new CreateVolumeExecutor();
