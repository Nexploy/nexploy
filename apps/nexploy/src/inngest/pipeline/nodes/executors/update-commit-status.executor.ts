import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { updateCommitStatusConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { githubUpdateCommitStatus } from '@/lib/api/github.api';
import { gitlabUpdateCommitStatus } from '@/lib/api/gitlab.api';
import { z } from 'zod';

export class UpdateCommitStatusExecutor
    implements INodeExecutor
{
    readonly type = 'update-commit-status';
    readonly configSchema = updateCommitStatusConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof updateCommitStatusConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId } = ctx;

        const { provider, token, owner, repo, sha, state, description, targetUrl } = nodeConfig;
        const statusOptions = { description, targetUrl };

        await logger.info(
            nodeId,
            `Updating ${provider} commit status for ${owner}/${repo}@${sha.slice(0, 8)} → ${state}`,
        );

        if (provider === 'github') {
            await githubUpdateCommitStatus(token, owner, repo, sha, state, statusOptions);
        } else if (provider === 'gitlab') {
            await gitlabUpdateCommitStatus(
                token,
                nodeConfig.baseUrl,
                owner,
                repo,
                sha,
                state,
                statusOptions,
            );
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        await logger.info(nodeId, `Commit status updated to "${state}"`);
        return { output: { provider, state, sha } };
    }
}

export const updateCommitStatusExecutor = new UpdateCommitStatusExecutor();
