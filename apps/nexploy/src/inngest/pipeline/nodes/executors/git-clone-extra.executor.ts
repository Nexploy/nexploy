import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { gitCloneExtraConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { safeResolvePath } from '@workspace/shared/pathSafety';
import { z } from 'zod';

export class GitCloneExtraExecutor implements INodeExecutor {
    readonly type = 'git-clone-extra';
    readonly configSchema = gitCloneExtraConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof gitCloneExtraConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { buildConfig, nodeConfig, allOutputs, logger, nodeId, edges } = ctx;

        const { repoUrl, branch, targetDir, token } = nodeConfig;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        if (!workDir) throw new Error('No workDir found — run a clone node first');

        const cloneDest = safeResolvePath(workDir, targetDir);

        await logger.info(nodeId, `Cloning extra repository → ${targetDir} (branch: ${branch})`);

        const onProgress = async (progress: number, message: string) => {
            await logger.info(nodeId, `${message} (${Math.round(progress)}%)`);
        };

        await gitService.cloneRepository(
            { ...buildConfig, gitUrl: repoUrl, gitBranch: branch },
            onProgress,
            { destDir: cloneDest, manualToken: token },
        );

        await logger.info(nodeId, `Repository cloned to ${targetDir}`);
        return { output: { repoUrl, branch, targetDir: cloneDest } };
    }
}

export const gitCloneExtraExecutor = new GitCloneExtraExecutor();
