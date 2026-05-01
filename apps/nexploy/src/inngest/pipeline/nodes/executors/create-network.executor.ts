import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { createNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CreateNetworkExecutor implements INodeExecutor {
    readonly type = 'create-network';
    readonly configSchema = createNetworkConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof createNetworkConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const name = nodeConfig.name;
        const driver = nodeConfig.driver;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Creating Docker network: ${name} (driver: ${driver})`);

        try {
            const result = await kyDocker
                .post('networks/create', {
                    json: { name, driver },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ id: string; name: string; alreadyExisted: boolean }>();

            if (result.alreadyExisted) {
                await logger.warn(nodeId, `Network ${name} already exists`);
            } else {
                await logger.info(nodeId, `Network created: ${name}`);
            }
            return { output: { networkId: result.id, networkName: name } };
        } catch (error) {
            throw new Error(
                `Failed to create network: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const createNetworkExecutor = new CreateNetworkExecutor();
