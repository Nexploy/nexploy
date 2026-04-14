import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    ResolvedConfig,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { createNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CreateNetworkExecutor implements INodeExecutor {
    readonly type = 'create-network';
    readonly configSchema = createNetworkConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolvedConfig<z.infer<typeof createNetworkConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const name = nodeConfig.name;
        const driver = nodeConfig.driver;
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
                output: { networkId: result.id, networkName: name },
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('already') || msg.includes('existe')) {
                await logger.info(nodeId, `Network already exists: ${name}`);
                return { output: { networkName: name }, skipped: true };
            }
            throw new Error(
                `Failed to create network: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const createNetworkExecutor = new CreateNetworkExecutor();
