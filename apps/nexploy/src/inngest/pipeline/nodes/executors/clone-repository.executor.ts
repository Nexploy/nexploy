import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { updateBuildGitInfo } from '@/services/repository/build.service';
import { cloneRepositoryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CloneRepositoryExecutor implements INodeExecutor {
    readonly type = 'clone-repository';
    readonly configSchema = cloneRepositoryConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof cloneRepositoryConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { buildId, buildConfig, nodeConfig, logger, nodeId, reporter } = ctx;

        const effectiveBranch = nodeConfig.branch;
        const effectiveCommitHash = nodeConfig.commitHash;

        const effectiveConfig = {
            ...buildConfig,
            gitBranch: effectiveBranch,
            gitCommitHash: effectiveCommitHash,
        };

        const commitSuffix = effectiveCommitHash
            ? ` (commit: ${effectiveCommitHash.substring(0, 7)})`
            : '';
        await logger.info(
            nodeId,
            `Cloning repository ${buildConfig.gitUrl} (branch: ${effectiveBranch}${commitSuffix})`,
        );

        const onProgress = async (progress: number, message: string) => {
            await logger.info(nodeId, `${message} (${Math.round(progress)}%)`);
        };

        try {
            const workDir = await gitService.cloneRepository(effectiveConfig, onProgress, {
                submodules: nodeConfig.submodules,
            });

            if (effectiveCommitHash) {
                await logger.info(
                    nodeId,
                    `Checked out commit ${effectiveCommitHash.substring(0, 7)}`,
                );
            }

            const commitInfo = await gitService.getCommitInfo(workDir);
            const resolvedHash = commitInfo?.hash ?? effectiveCommitHash;
            const resolvedMessage = commitInfo?.message;

            await updateBuildGitInfo(buildId, effectiveBranch, resolvedHash, resolvedMessage);
            await reporter.publishCommitInfo({
                branch: effectiveBranch,
                commitHash: resolvedHash,
                commitMessage: resolvedMessage,
            });

            await logger.info(
                nodeId,
                `Repository cloned successfully (branch: ${effectiveBranch}, commit: ${resolvedHash ?? 'unknown'})`,
            );

            return {
                output: {
                    workDir,
                    branch: effectiveBranch,
                    commitHash: resolvedHash,
                    commitMessage: resolvedMessage,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clone repository: ${message}`);
        }
    }
}

export const cloneRepositoryExecutor = new CloneRepositoryExecutor();
