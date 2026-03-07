import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';

export class CloneRepositoryExecutor implements INodeExecutor {
    readonly type = 'clone-repository';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, logger, nodeId } = ctx;

        const commitInfo = config.gitCommitHash
            ? ` (commit: ${config.gitCommitHash.substring(0, 7)})`
            : '';
        await logger.info(
            nodeId,
            `Cloning repository ${config.gitUrl} (branch: ${config.gitBranch}${commitInfo})`,
        );

        const onProgress = async (progress: number, message: string) => {
            await logger.info(nodeId, `${message} (${Math.round(progress)}%)`);
        };

        try {
            const workDir = await gitService.cloneRepository(config, onProgress);

            if (config.gitCommitHash) {
                await logger.info(
                    nodeId,
                    `Checked out commit ${config.gitCommitHash.substring(0, 7)}`,
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
