import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    ResolvedConfig,
} from '@/types/pipeline.type';
import { gitTagConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { z } from 'zod';

export class GitTagExecutor implements INodeExecutor {
    readonly type = 'git-tag';
    readonly configSchema = gitTagConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolvedConfig<z.infer<typeof gitTagConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId } = ctx;

        const { tagName, message, remote } = nodeConfig;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) throw new Error('No workDir found — run a clone node first');

        await logger.info(
            nodeId,
            `Creating git tag "${tagName}"${message ? ` with message: ${message}` : ''}`,
        );

        const { alreadyExists } = await gitService.createTag(workDir, tagName, message);
        if (alreadyExists) {
            await logger.warn(nodeId, `Tag "${tagName}" already exists, skipping creation`);
        }

        await logger.info(nodeId, `Pushing tag "${tagName}" to remote "${remote}"`);
        await gitService.pushTag(workDir, remote, tagName);

        await logger.info(nodeId, `Tag "${tagName}" pushed to ${remote}`);
        return { output: { tagName, remote } };
    }
}

export const gitTagExecutor = new GitTagExecutor();
