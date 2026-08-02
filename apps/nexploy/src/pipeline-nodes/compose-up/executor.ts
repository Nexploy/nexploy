import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { createDockerService } from '@workspace/pipeline-core/dockerService';
import { composeUpConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { requireComposeFileFromAncestor, resolveComposeEnvVars } from '@workspace/pipeline-core/composeContext';

export class ComposeUpExecutor implements INodeExecutor {
    readonly type = 'compose-up';
    readonly configSchema = composeUpConfigSchema;

    async execute(ctx: NodeExecutionContext<z.infer<typeof composeUpConfigSchema>>): Promise<NodeExecutionResult> {
        const { allOutputs, logger, nodeId, nodeConfig, abortSignal, edges, services } = ctx;
        const dockerService = createDockerService(services.docker);

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');

        if (!workDir) {
            throw new Error('No workDir found in input nodes — connect this node after a Clone Repository node');
        }

        const { composeFile, projectName } = requireComposeFileFromAncestor(ctx);

        const envVars = await resolveComposeEnvVars(ctx);
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Starting Docker Compose stack: ${projectName}`);

        try {
            const result = await dockerService.composeUp(
                workDir,
                projectName,
                composeFile,
                envVars,
                abortSignal,
                async (message: string) => logger.info(nodeId, message),
                environmentId,
                {
                    recreate: nodeConfig.recreate,
                    removeOrphans: nodeConfig.removeOrphans,
                    keepComposeFile: nodeConfig.keepComposeFile,
                },
            );

            await logger.info(
                nodeId,
                `Docker Compose stack started: ${projectName} (${result.containers.length} containers)`,
            );

            return {
                output: {
                    projectName: result.projectName,
                    containers: result.containers,
                    composeConfig: result.composeConfig,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            throw new Error(`Docker Compose up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const composeUpExecutor = new ComposeUpExecutor();
