import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    
} from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class ValidateComposeExecutor implements INodeExecutor {
    readonly type = 'validate-compose';
    readonly configSchema = composeFileConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof composeFileConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { allOutputs, logger, nodeId, nodeConfig } = ctx;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');

        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const composeFileName = nodeConfig.composeFileName;
        const composeFilePath = nodeConfig.composeFilePath;
        const composePath = composeFilePath
            ? `${composeFilePath.replace(/\/$/, '')}/${composeFileName}`
            : composeFileName;

        await logger.info(nodeId, `Validating Docker Compose file: ${composePath}`);

        try {
            const resolvedPath = await gitService.validateComposeFile(workDir, composePath);
            await gitService.validateComposeSyntax(workDir, resolvedPath);
            await logger.info(nodeId, `Docker Compose file validated: ${resolvedPath}`);

            return {
                output: { workDir, composePath: resolvedPath },
            };
        } catch (error) {
            throw new Error(
                `Docker Compose validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const validateComposeExecutor = new ValidateComposeExecutor();
