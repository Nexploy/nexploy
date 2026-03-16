import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';

export class CloneRepositoryExecutor implements INodeExecutor {
    readonly type = 'clone-repository';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, nodeConfig, logger, nodeId } = ctx;

        const effectiveBranch =
            (nodeConfig.branch as string | undefined) || config.gitBranch;
        const effectiveCommitHash =
            (nodeConfig.commitHash as string | undefined) || config.gitCommitHash;

        const effectiveConfig = {
            ...config,
            gitBranch: effectiveBranch,
            gitCommitHash: effectiveCommitHash || undefined,
        };

        const commitInfo = effectiveCommitHash
            ? ` (commit: ${effectiveCommitHash.substring(0, 7)})`
            : '';
        await logger.info(
            nodeId,
            `Cloning repository ${config.gitUrl} (branch: ${effectiveBranch}${commitInfo})`,
        );

        const onProgress = async (progress: number, message: string) => {
            await logger.info(nodeId, `${message} (${Math.round(progress)}%)`);
        };

        try {
            const workDir = await gitService.cloneRepository(effectiveConfig, onProgress);

            if (effectiveCommitHash) {
                await logger.info(
                    nodeId,
                    `Checked out commit ${effectiveCommitHash.substring(0, 7)}`,
                );
            }

            await logger.info(nodeId, 'Repository cloned successfully');

            return {
                success: true,
                output: { workDir },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clone repository: ${message}`);
        }
    }
}

export const cloneRepositoryExecutor = new CloneRepositoryExecutor();
