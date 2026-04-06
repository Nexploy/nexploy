import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { scaleServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class ScaleServiceExecutor implements INodeExecutor {
    readonly type = 'scale-service';
    readonly configSchema = scaleServiceConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const serviceName = nodeConfig.serviceName as string;
        const replicas = nodeConfig.replicas as number;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Scaling Swarm service "${serviceName}" to ${replicas} replica(s)`);

        try {
            await kyDocker
                .patch(`swarm/services/${encodeURIComponent(serviceName)}/scale`, {
                    json: { replicas },
                    signal: abortSignal,
                    environmentId,
                    timeout: 60000,
                } as KyDockerOptions)
                .json();

            await logger.info(nodeId, `Service "${serviceName}" scaled to ${replicas} replica(s)`);

            return { output: { serviceName, replicas } };
        } catch (error) {
            throw new Error(`Failed to scale service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const scaleServiceExecutor = new ScaleServiceExecutor();
