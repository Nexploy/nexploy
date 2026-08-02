import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { createReleaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class CreateReleaseExecutor implements INodeExecutor {
    readonly type = 'create-release';
    readonly configSchema = createReleaseConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof createReleaseConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, allOutputs, logger, abortSignal, edges, services } = ctx;

        const tagName =
            nodeConfig.tagName || getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'tagName') || '';

        if (!tagName) throw new Error('No tag name — provide one or connect a Git Tag node');

        const targetBranch = nodeConfig.targetBranch || 'main';

        const releaseTitle = nodeConfig.releaseTitle || tagName;
        const releaseNotes = nodeConfig.releaseNotes || '';
        const { draft, prerelease } = nodeConfig;

        const provider = buildConfig.gitProvider;

        await logger.info(nodeId, `Creating ${provider} release "${releaseTitle}" for tag "${tagName}"`);

        if (abortSignal.aborted) throw new Error('Build cancelled');

        const { releaseId, releaseUrl } = await services.git.createRelease(buildConfig, {
            tagName,
            targetBranch,
            title: releaseTitle,
            notes: releaseNotes,
            draft,
            prerelease,
        });

        await logger.info(nodeId, `Release created: ${releaseUrl}`);

        return { output: { releaseId, releaseUrl, tagName } };
    }
}

export const createReleaseExecutor = new CreateReleaseExecutor();
