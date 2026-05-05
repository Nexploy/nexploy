import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { createServiceConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class CreateServiceExecutor implements INodeExecutor {
    readonly type = 'create-service';
    readonly configSchema = createServiceConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof createServiceConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        const { serviceName, imageName, mode, replicas } = nodeConfig;

        await logger.info(
            nodeId,
            `Creating Swarm service "${serviceName}" from image ${imageName} (mode: ${mode}${mode === 'replicated' ? `, replicas: ${replicas}` : ''})`,
        );

        const env = [...(nodeConfig.envVarsSource ?? []), ...nodeConfig.envVars]
            .filter((v) => v.key)
            .map((v) => `${v.key}=${v.value}`);

        const ports = [...(nodeConfig.portsSource ?? []), ...nodeConfig.ports].map((p) => ({
            published: Number(p.publishedPort),
            target: Number(p.targetPort),
            protocol: p.protocol,
        }));

        try {
            const result = await kyDocker
                .post('swarm/services', {
                    json: {
                        name: serviceName,
                        image: imageName,
                        mode,
                        replicas: mode === 'replicated' ? replicas : undefined,
                        ...(ports.length > 0 ? { ports } : {}),
                        ...(env.length > 0 ? { env } : {}),
                        ...(nodeConfig.networks.length > 0
                            ? { networks: nodeConfig.networks.map((n) => n.value).filter(Boolean) }
                            : {}),
                        ...(nodeConfig.constraints.length > 0
                            ? { constraints: nodeConfig.constraints.map((c) => c.value).filter(Boolean) }
                            : {}),
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ id: string }>();

            await logger.info(nodeId, `Service "${serviceName}" created (ID: ${result.id.slice(0, 12)})`);

            return {
                output: {
                    serviceId: result.id,
                    serviceName,
                    imageName,
                },
            };
        } catch (error) {
            throw new Error(
                `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const createServiceExecutor = new CreateServiceExecutor();
