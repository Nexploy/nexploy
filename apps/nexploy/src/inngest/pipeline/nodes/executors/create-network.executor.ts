import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class CreateNetworkExecutor implements INodeExecutor {
    readonly type = 'create-network';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const name = nodeConfig.name as string;
        if (!name) throw new Error('Network name is required');

        const driver = (nodeConfig.driver as string | undefined) ?? 'bridge';
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Creating Docker network: ${name} (driver: ${driver})`);

        try {
            const result = await kyDocker
                .post('networks/create', {
                    json: { name, driver },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ id: string; name: string }>();

            await logger.info(nodeId, `Network created: ${name}`);

            return {
                success: true,
                output: { networkId: result.id, networkName: name },
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('already') || msg.includes('existe')) {
                await logger.info(nodeId, `Network already exists: ${name}`);
                return { success: true, output: { networkName: name }, skipped: true };
            }
            throw new Error(`Failed to create network: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const createNetworkExecutor = new CreateNetworkExecutor();
