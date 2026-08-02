import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { gitTagConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { createGitService } from '@workspace/pipeline-core/gitService';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/pipeline-core/schemas/nodeFieldRef.schema';

export class GitTagExecutor implements INodeExecutor {
    readonly type = 'git-tag';
    readonly configSchema = gitTagConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof gitTagConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, edges, services } = ctx;
        const gitService = createGitService(services);

        const { tagName, message, remote } = nodeConfig;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        if (!workDir) throw new Error('No workDir found — run a clone node first');

        await logger.info(nodeId, `Creating git tag "${tagName}"${message ? ` with message: ${message}` : ''}`);

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
