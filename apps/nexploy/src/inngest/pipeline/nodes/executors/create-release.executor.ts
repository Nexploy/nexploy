import { getFromClosestAncestor } from '@/types/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { createReleaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { githubCreateRelease } from '@/lib/api/github.api';
import { gitlabCreateRelease } from '@/lib/api/gitlab.api';
import { z } from 'zod';

export class CreateReleaseExecutor implements INodeExecutor {
    readonly type = 'create-release';
    readonly configSchema = createReleaseConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof createReleaseConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, logger, abortSignal, edges } = ctx;

        const { provider, token, owner, repo, baseUrl, targetBranch, draft, prerelease } =
            nodeConfig;

        const tagName =
            nodeConfig.tagName || getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'tagName') || '';

        if (!tagName) throw new Error('No tag name — provide one or connect a Git Tag node');

        const releaseTitle = nodeConfig.releaseTitle || tagName;
        const releaseNotes = nodeConfig.releaseNotes || '';

        await logger.info(
            nodeId,
            `Creating ${provider} release "${releaseTitle}" for tag "${tagName}"`,
        );

        if (abortSignal.aborted) throw new Error('Build cancelled');

        let releaseId: string;
        let releaseUrl: string;

        if (provider === 'github') {
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
        } else {
            const result = await gitlabCreateRelease(token, baseUrl, owner, repo, {
                tagName,
                ref: targetBranch,
                name: releaseTitle,
                description: releaseNotes,
            });
            releaseId = result.tag_name;
            releaseUrl = result._links.self;
        }

        await logger.info(nodeId, `Release created: ${releaseUrl}`);

        return { output: { releaseId, releaseUrl, tagName } };
    }
}

export const createReleaseExecutor = new CreateReleaseExecutor();
