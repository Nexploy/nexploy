import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { deleteNetworkConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/pipeline-core/schemas/nodeFieldRef.schema';
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
            result = await ctx.services.docker
                .post('networks/delete', {
                    json: { networkIds: [networkId], force },
                    signal: abortSignal,
                    environmentId,
                })
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
                reasonMessages[skippedEntry.reason ?? ''] ?? `Network ${networkId} error: ${skippedEntry.reason}`;
            throw new Error(msg);
        }

        await logger.info(nodeId, `Network deleted: ${networkId}`);
        return { output: { deletedNetwork: networkId } };
    }
}

export const deleteNetworkExecutor = new DeleteNetworkExecutor();
