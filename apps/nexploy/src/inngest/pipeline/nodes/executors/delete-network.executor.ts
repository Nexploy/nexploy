import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { deleteNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class DeleteNetworkExecutor implements INodeExecutor {
    readonly type = 'delete-network';
    readonly configSchema = deleteNetworkConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof deleteNetworkConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const networkName = nodeConfig.networkName.trim();
        const force = nodeConfig.force;
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Deleting Docker network: ${networkName}`);

        try {
            await kyDocker
                .post('networks/delete', {
                    json: { networkIds: [networkName], force },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ deleted: string[] }>();

            await logger.info(nodeId, `Network deleted: ${networkName}`);

            return { output: { deletedNetwork: networkName } };
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('not found') || msg.includes('no such network')) {
                await logger.info(nodeId, `Network not found, skipping: ${networkName}`);
                return { output: { deletedNetwork: networkName }, skipped: true };
            }
            throw new Error(
                `Failed to delete network: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const deleteNetworkExecutor = new DeleteNetworkExecutor();
