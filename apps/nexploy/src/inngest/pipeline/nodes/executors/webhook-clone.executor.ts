import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { updateBuildGitInfo } from '@/services/inngest/build.inngest.service';

function matchesBranchFilter(branch: string, filter: string): boolean {
    const patterns = filter
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    if (patterns.length === 0) return true;

    return patterns.some((pattern) => {
        if (pattern.endsWith('*')) {
            return branch.startsWith(pattern.slice(0, -1));
        }
        return branch === pattern;
    });
}

export class WebhookCloneExecutor implements INodeExecutor {
    readonly type = 'webhook-clone';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { buildId, config, nodeConfig, logger, nodeId, reporter } = ctx;

        const branch = config.gitBranch;
        const commitHash = config.gitCommitHash;

        if (!branch) {
            throw new Error(
                'No branch found in webhook payload — this node requires a webhook-triggered build',
            );
        }

        const branchFilter = (nodeConfig.branchFilter as string) ?? '';
        if (branchFilter && !matchesBranchFilter(branch, branchFilter)) {
            await logger.info(
                nodeId,
                `Branch "${branch}" does not match filter "${branchFilter}" — skipping`,
            );
            return {
                success: true,
                output: { skipped: true, reason: 'branch-filter' },
            };
        }

        const commitSuffix = commitHash ? ` (commit: ${commitHash.substring(0, 7)})` : '';
        await logger.info(
            nodeId,
            `Cloning repository ${config.gitUrl} from webhook payload (branch: ${branch}${commitSuffix})`,
        );

        const onProgress = async (progress: number, message: string) => {
            await logger.info(nodeId, `${message} (${Math.round(progress)}%)`);
        };

        try {
            const effectiveConfig = {
                ...config,
                gitBranch: branch,
                gitCommitHash: commitHash,
            };

            const workDir = await gitService.cloneRepository(effectiveConfig, onProgress);

            if (commitHash) {
                await logger.info(nodeId, `Checked out commit ${commitHash.substring(0, 7)}`);
            }

            const commitInfo = await gitService.getCommitInfo(workDir);
            const resolvedHash = commitInfo?.hash ?? commitHash;
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
                success: true,
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
