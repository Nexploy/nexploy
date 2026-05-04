import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { updateBuildGitInfo } from '@/services/repository/build.service';
import { webhookCloneConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class WebhookCloneExecutor implements INodeExecutor {
    readonly type = 'webhook-clone';
    readonly configSchema = webhookCloneConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof webhookCloneConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { buildId, buildConfig, nodeConfig, logger, nodeId, reporter } = ctx;

        const branch = buildConfig.gitBranch;

        if (!branch) {
            throw new Error(
                'No branch found in webhook payload — this node requires a webhook-triggered build',
            );
        }

        const branchFilter = nodeConfig.branchFilter;
        if (branchFilter && !gitService.matchesBranchFilter(branch, branchFilter)) {
            await logger.info(
                nodeId,
                `Branch "${branch}" does not match filter "${branchFilter}" — skipping`,
            );
            return {
                output: { skipped: true, reason: 'branch-filter' },
            };
        }

        await logger.info(
            nodeId,
            `Cloning repository ${buildConfig.gitUrl} from webhook payload (branch: ${branch})`,
        );

        const onProgress = async (progress: number, message: string) => {
            await logger.info(nodeId, `${message} (${Math.round(progress)}%)`);
        };

        try {
            const effectiveConfig = {
                ...buildConfig,
                gitBranch: branch,
            };

            const workDir = await gitService.cloneRepository(effectiveConfig, onProgress, {
                submodules: nodeConfig.submodules,
            });

            const commitInfo = await gitService.getCommitInfo(workDir);
            const resolvedHash = commitInfo?.hash;
            const resolvedMessage = commitInfo?.message;

            await updateBuildGitInfo(buildId, branch, resolvedHash, resolvedMessage);
            await reporter.publishCommitInfo({
                branch,
                commitHash: resolvedHash,
                commitMessage: resolvedMessage,
            });

            await logger.info(
                nodeId,
                `Repository cloned successfully from webhook (branch: ${branch}, commit: ${resolvedHash ?? 'unknown'})`,
            );

            return {
                output: {
                    workDir,
                    branch,
                    commitHash: resolvedHash,
                    commitMessage: resolvedMessage,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clone repository from webhook: ${message}`);
        }
    }
}

export const webhookCloneExecutor = new WebhookCloneExecutor();
