import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { createDockerService } from '@workspace/pipeline-core/dockerService';
import { composeRunConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/pipeline-core/schemas/nodeFieldRef.schema';
import { requireComposeFileFromAncestor, resolveComposeEnvVars } from '@workspace/pipeline-core/composeContext';

export class ComposeRunExecutor implements INodeExecutor {
    readonly type = 'compose-run';
    readonly configSchema = composeRunConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof composeRunConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { allOutputs, logger, nodeId, nodeConfig, abortSignal, edges, services } = ctx;
        const dockerService = createDockerService(services.docker);

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');

        if (!workDir) {
            throw new Error('No workDir found in input nodes — connect this node after a Clone Repository node');
        }

        const { composeFile, projectName } = requireComposeFileFromAncestor(ctx);

        const service = nodeConfig.service.trim();
        const command = nodeConfig.command.trim();

        if (!service) {
            throw new Error('No service configured for this Compose Run node');
        }

        const envVars = await resolveComposeEnvVars(ctx);
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Running one-off compose command in "${service}"${command ? `: ${command}` : ''}`);

        try {
            const result = await dockerService.composeRun(
                workDir,
                projectName,
                composeFile,
                service,
                command || undefined,
                envVars,
                abortSignal,
                async (message: string) => logger.info(nodeId, message),
                environmentId,
                {
                    noDeps: nodeConfig.noDeps,
                    user: nodeConfig.user.trim() || undefined,
                    workingDir: nodeConfig.workingDir.trim() || undefined,
                },
            );

            return { output: { exitCode: result.exitCode, service, projectName, composeFile } };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;

            const message = error instanceof Error ? error.message : 'Unknown error';

            if (nodeConfig.continueOnError) {
                await logger.warn(nodeId, `Compose run failed (continuing due to continueOnError): ${message}`);
                return { output: { exitCode: 1, service, projectName, composeFile } };
            }

            throw new Error(`Docker Compose run failed: ${message}`);
        }
    }
}

export const composeRunExecutor = new ComposeRunExecutor();
