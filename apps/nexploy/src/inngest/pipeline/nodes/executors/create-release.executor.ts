import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { createReleaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { githubCreateRelease } from '@/lib/api/github.api';
import { gitlabCreateRelease } from '@/lib/api/gitlab.api';
import {
    extractGitHubRepo,
    extractGitLabRepo,
    getGitProviderToken,
} from '@/services/git/git.service';
import { getValidToken } from '@/services/api/gitProvider.service';
import { z } from 'zod';

export class CreateReleaseExecutor implements INodeExecutor {
    readonly type = 'create-release';
    readonly configSchema = createReleaseConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof createReleaseConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, allOutputs, logger, abortSignal, edges } = ctx;

        const tagName =
            nodeConfig.tagName ||
            getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'tagName') ||
            '';

        if (!tagName) throw new Error('No tag name — provide one or connect a Git Tag node');

        const targetBranch = nodeConfig.targetBranch || 'main';

        const releaseTitle = nodeConfig.releaseTitle || tagName;
        const releaseNotes = nodeConfig.releaseNotes || '';
        const { draft, prerelease } = nodeConfig;

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

        await logger.info(
            nodeId,
            `Creating ${provider} release "${releaseTitle}" for tag "${tagName}"`,
        );

        if (abortSignal.aborted) throw new Error('Build cancelled');

        let releaseId: string;
        let releaseUrl: string;

        if (provider === 'GITHUB') {
            const { owner, repo } = extractGitHubRepo(buildConfig.gitUrl);
            const result = await githubCreateRelease(token, owner, repo, {
                tagName,
                targetBranch,
                name: releaseTitle,
                body: releaseNotes,
                draft,
                prerelease,
            });
            releaseId = String(result.id);
            releaseUrl = result.html_url;
        } else if (provider === 'GITLAB') {
            const { baseUrl, owner, repo } = extractGitLabRepo(buildConfig.gitUrl);
            const result = await gitlabCreateRelease(token, baseUrl, owner, repo, {
                tagName,
                ref: targetBranch,
                name: releaseTitle,
                description: releaseNotes,
            });
            releaseId = result.tag_name;
            releaseUrl = result._links.self;
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        await logger.info(nodeId, `Release created: ${releaseUrl}`);

        return { output: { releaseId, releaseUrl, tagName } };
    }
}

export const createReleaseExecutor = new CreateReleaseExecutor();
