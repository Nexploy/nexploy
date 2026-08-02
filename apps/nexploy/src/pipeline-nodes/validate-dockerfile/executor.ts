import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { createGitService } from '@workspace/pipeline-core/gitService';
import { validateDockerfileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class ValidateDockerfileExecutor implements INodeExecutor {
    readonly type = 'validate-dockerfile';
    readonly configSchema = validateDockerfileConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof validateDockerfileConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { allOutputs, logger, nodeId, nodeConfig, edges, services } = ctx;
        const gitService = createGitService(services);

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');

        if (!workDir) {
            throw new Error('No workDir found in input nodes — connect this node after a Clone Repository node');
        }

        const dockerfilePath = nodeConfig.dockerfilePath;

        await logger.info(nodeId, `Validating Dockerfile: ${dockerfilePath}`);

        try {
            await gitService.validateDockerfile(workDir, dockerfilePath);
            await logger.info(nodeId, `Dockerfile validated: ${dockerfilePath}`);

            return {
                output: { workDir, dockerfilePath },
            };
        } catch (error) {
            throw new Error(
                `Dockerfile validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const validateDockerfileExecutor = new ValidateDockerfileExecutor();
