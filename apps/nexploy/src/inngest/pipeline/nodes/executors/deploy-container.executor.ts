import {
    getFromAllOutputs,
    getFromClosestAncestor,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { deployContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class DeployContainerExecutor implements INodeExecutor {
    readonly type = 'deploy-container';
    readonly configSchema = deployContainerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof deployContainerConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { buildConfig, allOutputs, edges, logger, nodeId, abortSignal } = ctx;

        const imageName = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'imageName');

        if (!imageName) {
            throw new Error('No imageName found — add a Build Docker Image node to your pipeline');
        }

        await logger.info(nodeId, 'Starting container deployment');

        try {
            const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

            const containerName = `nexploy-${buildConfig.repositoryId}-${nodeId}`;

            const result = await dockerService.deployContainer(
                buildConfig.repositoryId,
                imageName,
                buildConfig.envVariables,
                abortSignal,
                containerName,
                environmentId,
            );

            await logger.info(nodeId, `Container deployed: ${result.containerId.slice(0, 12)}`);

            return {
                output: {
                    containerId: result.containerId,
                    imageName,
                },
            };
        } catch (error) {
            throw new Error(
                `Container deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const deployContainerExecutor = new DeployContainerExecutor();
