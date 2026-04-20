import { getFromAllOutputs, INodeExecutor, NodeExecutionContext, NodeExecutionResult, } from '@/types/pipeline.type';
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

        let result: { deleted: string[]; skipped: { id: string; name: string; reason?: string }[] };
        try {
            result = await kyDocker
                .post('networks/delete', {
                    json: { networkIds: [networkName], force },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json();
        } catch (error) {
            throw new Error(`Failed to delete network: ${networkName}`);
        }

        const skippedEntry = result.skipped?.find(
            (s) => s.id === networkName || s.name === networkName,
        );

        if (skippedEntry) {
            const reasonMessages: Record<string, string> = {
                has_containers: `Network ${networkName} is in use by containers`,
                builtin: `Network ${networkName} is a built-in network`,
                compose_stack: `Network ${networkName} belongs to a Compose stack`,
                not_found: `Network ${networkName} not found`,
            };
            const msg =
                reasonMessages[skippedEntry.reason ?? ''] ??
                `Network ${networkName} error: ${skippedEntry.reason}`;
            throw new Error(msg);
        }

        await logger.info(nodeId, `Network deleted: ${networkName}`);
        return { output: { deletedNetwork: networkName } };
    }
}

export const deleteNetworkExecutor = new DeleteNetworkExecutor();
