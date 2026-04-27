import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { cherryPickCommitConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { z } from 'zod';

export class CherryPickCommitExecutor implements INodeExecutor {
    readonly type = 'cherry-pick-commit';
    readonly configSchema = cherryPickCommitConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof cherryPickCommitConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, logger, abortSignal } = ctx;

        const { targetBranch, noCommit, remote } = nodeConfig;

        const commitHash =
            nodeConfig.commitHash || getFromAllOutputs<string>(allOutputs, 'commitHash') || '';
        if (!commitHash)
            throw new Error('No commit hash — provide one or connect an upstream node');

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) throw new Error('No workDir found — connect a clone node first');

        if (abortSignal.aborted) throw new Error('Build cancelled');

        await logger.info(
            nodeId,
            `Cherry-picking commit ${commitHash}${noCommit ? ' (--no-commit)' : ''}`,
        );

        await gitService.cherryPick(workDir, commitHash, { noCommit, remote, targetBranch });

        await logger.info(nodeId, `Cherry-pick of ${commitHash} applied successfully`);

        return { output: { workDir, commitHash } };
    }
}

export const cherryPickCommitExecutor = new CherryPickCommitExecutor();
