import { getFromAllOutputs } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { updateCommitStatusConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

export class UpdateCommitStatusExecutor implements INodeExecutor {
    readonly type = 'update-commit-status';
    readonly configSchema = updateCommitStatusConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof updateCommitStatusConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, allOutputs, logger, services } = ctx;

        const { state, context, description } = nodeConfig;

        const provider = buildConfig.gitProvider;

        const sha = getFromAllOutputs<string>(allOutputs, 'commitHash') ?? '';

        if (!sha) throw new Error('No commit SHA found — connect a Clone Repository node before this one');

        const { owner, repo } = services.git.parseRepoUrl(provider, buildConfig.gitUrl);

        await logger.info(
            nodeId,
            `Updating ${provider} commit status for ${owner}/${repo}@${sha.slice(0, 8)} → ${state}`,
        );

        await services.git.updateCommitStatus(buildConfig, { sha, state, description, context });

        await logger.info(nodeId, `Commit status updated to "${state}"`);
        return { output: { provider, state, sha, context, description } };
    }
}

export const updateCommitStatusExecutor = new UpdateCommitStatusExecutor();
