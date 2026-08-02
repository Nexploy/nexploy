import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/pipeline-core/pipeline';
import { createGitService } from '@workspace/pipeline-core/gitService';
import { webhookCloneConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';
import { matchesWebhookTrigger } from '@workspace/pipeline-core/webhookTrigger';
import { WebhookTrigger } from '@workspace/pipeline-core/webhook';
import { z } from 'zod';

const SKIP_MESSAGES: Record<string, (detail: string) => string> = {
    'event-filter': (detail) => `Webhook event "${detail}" is not enabled on this node — skipping`,
    'merge-request-action': (detail) => `Merge request action "${detail}" is not enabled on this node — skipping`,
    'tag-filter': (detail) => `Tag "${detail}" does not match the tag filter — skipping`,
    'branch-filter': (detail) => `Branch "${detail}" does not match the branch filter — skipping`,
};

export class WebhookCloneExecutor implements INodeExecutor {
    readonly type = 'webhook-clone';
    readonly configSchema = webhookCloneConfigSchema;

    async execute(ctx: NodeExecutionContext<z.infer<typeof webhookCloneConfigSchema>>): Promise<NodeExecutionResult> {
        const { buildId, buildConfig, nodeConfig, logger, nodeId, reporter, services } = ctx;
        const gitService = createGitService(services);

        const branch = buildConfig.gitBranch;

        if (!branch) {
            throw new Error('No branch found in webhook payload — this node requires a webhook-triggered build');
        }

        const trigger: WebhookTrigger = buildConfig.webhookTrigger ?? { event: 'push' };
        const match = matchesWebhookTrigger(nodeConfig, trigger, branch);

        if (!match.matched) {
            const describe = match.reason ? SKIP_MESSAGES[match.reason] : undefined;
            await logger.info(nodeId, describe?.(match.detail ?? '') ?? 'Webhook event filtered out — skipping');
            return {
                output: { skipped: true, reason: match.reason },
            };
        }

        const refLabel = trigger.event === 'tag' ? `tag: ${trigger.tagName ?? branch}` : `branch: ${branch}`;

        await logger.info(nodeId, `Cloning repository ${buildConfig.gitUrl} from webhook payload (${refLabel})`);

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

            await services.build.updateGitInfo(buildId, branch, resolvedHash, resolvedMessage);
            await reporter.publishCommitInfo({
                branch,
                commitHash: resolvedHash,
                commitMessage: resolvedMessage,
            });

            await logger.info(
                nodeId,
                `Repository cloned successfully from webhook (${refLabel}, commit: ${resolvedHash ?? 'unknown'})`,
            );

            return {
                output: {
                    workDir,
                    branch,
                    commitHash: resolvedHash,
                    commitMessage: resolvedMessage,
                    event: trigger.event,
                    tagName: trigger.tagName,
                    targetBranch: trigger.targetBranch,
                    mergeRequestAction: trigger.mergeRequestAction,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clone repository from webhook: ${message}`);
        }
    }
}

export const webhookCloneExecutor = new WebhookCloneExecutor();
