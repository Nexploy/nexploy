import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { createDockerService } from '@workspace/pipeline-core/dockerService';
import {
    getComposeProjectName,
    resolveComposeEnvVars,
    resolveComposeLabels,
} from '@workspace/pipeline-core/composeContext';
import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class DeployComposeExecutor implements INodeExecutor {
    readonly type = 'deploy-compose';
    readonly configSchema = composeFileConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof composeFileConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { buildConfig, allOutputs, logger, nodeId, nodeConfig, abortSignal, edges, services } = ctx;
        const dockerService = createDockerService(services.docker);

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');

        if (!workDir) {
            throw new Error('No workDir found in input nodes — connect this node after a Clone Repository node');
        }

        const composeFileName = nodeConfig.composeFileName;
        const composeFilePath = nodeConfig.composeFilePath;
        const composePath = composeFilePath
            ? `${composeFilePath.replace(/\/$/, '')}/${composeFileName}`
            : composeFileName;
        const projectName = getComposeProjectName(buildConfig.repositoryId);

        const envVars = await resolveComposeEnvVars(ctx);
        const labels = resolveComposeLabels(ctx);

        await logger.info(nodeId, `Deploying Docker Compose stack: ${projectName}`);

        const onLog = async (message: string) => logger.info(nodeId, message);

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        try {
            const result = await dockerService.deployCompose(
                workDir,
                projectName,
                composePath,
                envVars,
                abortSignal,
                onLog,
                environmentId,
                buildConfig.buildId,
                buildConfig.repositoryId,
                labels,
                nodeConfig.noCache,
            );

            await logger.info(
                nodeId,
                `Docker Compose stack deployed: ${projectName}${
                    result.containers ? ` (${result.containers.length} containers)` : ''
                }`,
            );

            return {
                output: {
                    projectName,
                    containers: result.containers ?? [],
                    composeConfig: result.composeConfig,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            throw new Error(
                `Docker Compose deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const deployComposeExecutor = new DeployComposeExecutor();
