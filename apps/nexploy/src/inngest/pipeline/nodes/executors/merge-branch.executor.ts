import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { mergeBranchConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { z } from 'zod';

export class MergeBranchExecutor implements INodeExecutor {
    readonly type = 'merge-branch';
    readonly configSchema = mergeBranchConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof mergeBranchConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, logger, abortSignal, edges } = ctx;

        const { targetBranch, strategy, message, remote, push } = nodeConfig;

        const sourceBranch =
            nodeConfig.sourceBranch || getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'branch') || '';
        if (!sourceBranch)
            throw new Error('No source branch — provide one or connect an upstream node');

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        if (!workDir) throw new Error('No workDir found — connect a clone node first');

        if (abortSignal.aborted) throw new Error('Build cancelled');

        await logger.info(
            nodeId,
            `Merging "${sourceBranch}" → "${targetBranch || 'current branch'}" (strategy: ${strategy})`,
        );

        const mergedInto = await gitService.mergeBranch(workDir, sourceBranch, {
            strategy,
            message,
            remote,
            push,
            targetBranch,
        });

        await logger.info(
            nodeId,
            `Merge complete${push ? ` — pushed to ${remote}/${mergedInto}` : ''}`,
        );

        return { output: { workDir, targetBranch: mergedInto, sourceBranch } };
    }
}

export const mergeBranchExecutor = new MergeBranchExecutor();
