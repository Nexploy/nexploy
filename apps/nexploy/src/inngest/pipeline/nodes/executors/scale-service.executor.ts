import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { scaleServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class ScaleServiceExecutor implements INodeExecutor {
    readonly type = 'scale-service';
    readonly configSchema = scaleServiceConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof scaleServiceConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const serviceId = nodeConfig.serviceId;
        const serviceName = nodeConfig.serviceName;
        const replicas = nodeConfig.replicas;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(
            nodeId,
            `Scaling Swarm service "${serviceName}" to ${replicas} replica(s)`,
        );

        try {
            await kyDocker
                .post(`swarm/services/${serviceId}/scale`, {
                    json: { replicas },
                    signal: abortSignal,
                    environmentId,
                    timeout: 60000,
                } as KyDockerOptions)
                .json();

            await logger.info(nodeId, `Service "${serviceName}" scaled to ${replicas} replica(s)`);

            return { output: { serviceName, replicas } };
        } catch (error) {
            throw new Error(
                `Failed to scale service: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const scaleServiceExecutor = new ScaleServiceExecutor();
