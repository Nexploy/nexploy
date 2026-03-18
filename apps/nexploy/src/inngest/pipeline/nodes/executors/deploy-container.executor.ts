import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { dockerService } from '@/inngest/pipeline/services/docker.service';

export class DeployContainerExecutor implements INodeExecutor {
    readonly type = 'deploy-container';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, allOutputs, logger, nodeId, abortSignal } = ctx;

        const imageName =
            getFromInputs<string>(inputOutputs, 'imageName') ??
            getFromAllOutputs<string>(allOutputs, 'imageName') ??
            config.imageName;

        if (!imageName) {
            throw new Error(
                'No imageName found — connect this node after a Build Docker Image node',
            );
        }

        await logger.info(nodeId, 'Starting container deployment');

        try {
            const environmentId =
                getFromAllOutputs<string>(allOutputs, 'environmentId');

        const result = await dockerService.deployContainer(
                config.repositoryId,
                imageName,
                config.envVariables,
                abortSignal,
                environmentId,
            );

            await logger.info(nodeId, `Container deployed: ${result.containerId.slice(0, 12)}`);

            return {
                success: true,
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
