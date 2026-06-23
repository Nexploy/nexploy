import { getFromAllOutputs } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { updateCommitStatusConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { githubUpdateCommitStatus } from '@/lib/api/github.api';
import { gitlabUpdateCommitStatus } from '@/lib/api/gitlab.api';
import {
    extractGitHubRepo,
    extractGitLabRepo,
    getGitProviderToken,
} from '@/services/git/git.service';
import { getValidToken } from '@/services/api/gitProvider.service';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class UpdateCommitStatusExecutor implements INodeExecutor {
    readonly type = 'update-commit-status';
    readonly configSchema = updateCommitStatusConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof updateCommitStatusConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, allOutputs, logger } = ctx;

        const { state, context, description } = nodeConfig;

        const provider = buildConfig.gitProvider;

        const tokenData = await getGitProviderToken(provider, {
            gitAccountId: buildConfig.gitAccountId,
            requestedUserId: buildConfig.userId,
        });
        const validToken = await getValidToken(
            tokenData,
            provider,
            buildConfig.userId,
            buildConfig.gitAccountId,
        );
        const token = validToken.accessToken;

        if (!token) throw new Error('No access token available for Git provider');

        const sha = getFromAllOutputs<string>(allOutputs, 'commitHash') ?? '';

        if (!sha)
            throw new Error(
                'No commit SHA found — connect a Clone Repository node before this one',
            );

        const statusOptions = { description, context };

        if (provider === 'GITHUB') {
            const { owner, repo } = await extractGitHubRepo(buildConfig.gitUrl);
            await logger.info(
                nodeId,
                `Updating GitHub commit status for ${owner}/${repo}@${sha.slice(0, 8)} → ${state}`,
            );
            await githubUpdateCommitStatus(token, owner, repo, sha, state, statusOptions);
        } else if (provider === 'GITLAB') {
            const { baseUrl, owner, repo } = await extractGitLabRepo(buildConfig.gitUrl);
            await logger.info(
                nodeId,
                `Updating GitLab commit status for ${owner}/${repo}@${sha.slice(0, 8)} → ${state}`,
            );
            await gitlabUpdateCommitStatus(token, baseUrl, owner, repo, sha, state, statusOptions);
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        await logger.info(nodeId, `Commit status updated to "${state}"`);
        return { output: { provider, state, sha, context, description } };
    }
}

export const updateCommitStatusExecutor = new UpdateCommitStatusExecutor();
