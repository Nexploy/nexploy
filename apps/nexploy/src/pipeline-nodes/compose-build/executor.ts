import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { composeBuildConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import {
    getComposeProjectName,
    resolveComposeEnvVars,
    resolveComposeLabels,
} from '@/inngest/pipeline/utils/composeContext';

export class ComposeBuildExecutor implements INodeExecutor {
    readonly type = 'compose-build';
    readonly configSchema = composeBuildConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof composeBuildConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { buildConfig, allOutputs, logger, nodeId, nodeConfig, abortSignal, edges } = ctx;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');

        if (!workDir) {
            throw new Error('No workDir found in input nodes — connect this node after a Clone Repository node');
        }

        const composeFilePath = nodeConfig.composeFilePath;
        const composePath = composeFilePath
            ? `${composeFilePath.replace(/\/$/, '')}/${nodeConfig.composeFileName}`
            : nodeConfig.composeFileName;

        const projectName = getComposeProjectName(buildConfig.repositoryId);
        const envVars = await resolveComposeEnvVars(ctx);
        const labels = resolveComposeLabels(ctx);
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Building Docker Compose stack: ${projectName}`);

        try {
            const result = await dockerService.composeBuild(
                workDir,
                projectName,
                composePath,
                envVars,
                abortSignal,
                async (message: string) => logger.info(nodeId, message),
                environmentId,
                labels,
                nodeConfig.noCache,
            );

            await logger.info(
                nodeId,
                `Compose images ready (${result.builtServices.length} built, ${result.services.length} service(s) total)`,
            );

            return {
                output: {
                    projectName: result.projectName,
                    composeFile: result.composeFile,
                    services: result.services,
                    builtServices: result.builtServices,
                    composeConfig: result.composeConfig,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            throw new Error(`Docker Compose build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const composeBuildExecutor = new ComposeBuildExecutor();
