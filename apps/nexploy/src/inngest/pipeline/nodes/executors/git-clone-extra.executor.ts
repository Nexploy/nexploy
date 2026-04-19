import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    
} from '@/types/pipeline.type';
import { gitCloneExtraConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { safeResolvePath } from '@/inngest/pipeline/utils/pathSafety';
import { z } from 'zod';

export class GitCloneExtraExecutor implements INodeExecutor {
    readonly type = 'git-clone-extra';
    readonly configSchema = gitCloneExtraConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof gitCloneExtraConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId } = ctx;

        const { repoUrl, branch, targetDir, token } = nodeConfig;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) throw new Error('No workDir found — run a clone node first');

        const cloneDest = safeResolvePath(workDir, targetDir);

        await logger.info(nodeId, `Cloning extra repository → ${targetDir} (branch: ${branch})`);

        await gitService.cloneExternal(repoUrl, branch, cloneDest, token);

        await logger.info(nodeId, `Repository cloned to ${targetDir}`);
        return { output: { repoUrl, branch, targetDir: cloneDest } };
    }
}

export const gitCloneExtraExecutor = new GitCloneExtraExecutor();
