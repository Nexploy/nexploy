import { getFromAllOutputs, INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { createContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CreateContainerExecutor implements INodeExecutor {
    readonly type = 'create-container';
    readonly configSchema = createContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof createContainerConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const containerName = nodeConfig.containerName?.trim();
        const imageName = nodeConfig.imageName?.trim();

        await logger.info(
            nodeId,
            `Creating container from image: ${imageName}${containerName ? ` (name: ${containerName})` : ''}`,
        );

        try {
            const result = await kyDocker
                .post('container/create', {
                    json: {
                        name: containerName,
                        image: imageName,
                        restart: nodeConfig.restartPolicy,
                        network: nodeConfig.networkName?.trim() || undefined,
                        autoRemove: false,
                        privileged: false,
                        ports: nodeConfig.ports,
                        envVars: nodeConfig.envVars,
                        volumes: nodeConfig.volumes,
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ id: string }>();

            await logger.info(nodeId, `Container created: ${result.id.slice(0, 12)}`);

            return {
                output: {
                    containerId: result.id,
                    containerName: containerName ?? result.id.slice(0, 12),
                    imageName,
                },
            };
        } catch (error) {
            throw new Error(
                `Failed to create container: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const createContainerExecutor = new CreateContainerExecutor();
