import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { updateServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class UpdateServiceExecutor implements INodeExecutor {
    readonly type = 'update-service';
    readonly configSchema = updateServiceConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const serviceName = nodeConfig.serviceName as string;
        const image = nodeConfig.image as string;
        const tag = nodeConfig.tag as string;
        const forceUpdate = nodeConfig.forceUpdate as boolean;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
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
                success: true,
                output: { serviceName, image, tag, fullImage },
            };
        } catch (error) {
            throw new Error(`Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const updateServiceExecutor = new UpdateServiceExecutor();
