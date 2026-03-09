import {
    getFromAllOutputs,
    getFromInputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';

export class ValidateDockerfileExecutor implements INodeExecutor {
    readonly type = 'validate-dockerfile';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { inputOutputs, allOutputs, logger, nodeId, nodeConfig } = ctx;

        const workDir =
            getFromInputs<string>(inputOutputs, 'workDir') ??
            getFromAllOutputs<string>(allOutputs, 'workDir');

        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const dockerfilePath = (nodeConfig.dockerfilePath as string | undefined) ?? 'Dockerfile';

        await logger.info(nodeId, `Validating Dockerfile: ${dockerfilePath}`);

        try {
            await gitService.validateDockerfile(workDir, dockerfilePath);
            await logger.info(nodeId, `Dockerfile validated: ${dockerfilePath}`);

            return {
                success: true,
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
