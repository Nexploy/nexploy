import { getFromClosestAncestor } from '@/types/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { updateServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class UpdateServiceExecutor implements INodeExecutor {
    readonly type = 'update-service';
    readonly configSchema = updateServiceConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof updateServiceConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const serviceName = nodeConfig.serviceName;
        const image = nodeConfig.image;
        const tag = nodeConfig.tag;
        const forceUpdate = nodeConfig.forceUpdate;

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');
        const fullImage = `${image}:${tag}`;

        await logger.info(nodeId, `Updating Swarm service "${serviceName}" to image ${fullImage}`);

        try {
            await kyDocker
                .patch(`swarm/services/${encodeURIComponent(serviceName)}`, {
                    json: {
                        image: fullImage,
                        forceUpdate,
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 120000,
                } as KyDockerOptions)
                .json();

            await logger.info(nodeId, `Service "${serviceName}" updated to ${fullImage}`);

            return {
                output: { serviceName, image, tag, fullImage },
            };
        } catch (error) {
            throw new Error(
                `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const updateServiceExecutor = new UpdateServiceExecutor();
