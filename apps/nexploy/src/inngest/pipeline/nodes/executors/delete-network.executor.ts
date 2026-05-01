import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
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
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const networkId = nodeConfig.networkId;
        const force = nodeConfig.force;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Deleting Docker network: ${networkId}`);

        let result: { deleted: string[]; skipped: { id: string; name: string; reason?: string }[] };
        try {
            result = await kyDocker
                .post('networks/delete', {
                    json: { networkIds: [networkId], force },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json();
        } catch (error) {
            throw new Error(`Failed to delete network: ${networkId}`);
        }

        const skippedEntry = result.skipped?.find((s) => s.id === networkId);

        if (skippedEntry) {
            const reasonMessages: Record<string, string> = {
                has_containers: `Network ${networkId} is in use by containers`,
                builtin: `Network ${networkId} is a built-in network`,
                compose_stack: `Network ${networkId} belongs to a Compose stack`,
                not_found: `Network ${networkId} not found`,
            };
            const msg =
                reasonMessages[skippedEntry.reason ?? ''] ??
                `Network ${networkId} error: ${skippedEntry.reason}`;
            throw new Error(msg);
        }

        await logger.info(nodeId, `Network deleted: ${networkId}`);
        return { output: { deletedNetwork: networkId } };
    }
}

export const deleteNetworkExecutor = new DeleteNetworkExecutor();
