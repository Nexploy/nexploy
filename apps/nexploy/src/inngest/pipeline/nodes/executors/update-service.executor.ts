import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { updateServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class UpdateServiceExecutor implements INodeExecutor {
    readonly type = 'update-service';
    readonly configSchema = updateServiceConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof updateServiceConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const serviceId = nodeConfig.serviceId;
        const serviceName = nodeConfig.serviceName;
        const image = nodeConfig.image;
        const forceUpdate = nodeConfig.forceUpdate;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(nodeId, `Updating Swarm service "${serviceName}" to image ${image}`);

        try {
            await kyDocker
                .patch(`swarm/services/${serviceId}`, {
                    json: {
                        image,
                        forceUpdate,
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 120000,
                } as KyDockerOptions)
                .json();

            await logger.info(nodeId, `Service "${serviceName}" updated to ${image}`);

            return {
                output: { serviceName, image },
            };
        } catch (error) {
            throw new Error(
                `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const updateServiceExecutor = new UpdateServiceExecutor();
