import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { updateCommitStatusConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class UpdateCommitStatusExecutor implements INodeExecutor {
    readonly type = 'update-commit-status';
    readonly configSchema = updateCommitStatusConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const provider = nodeConfig.provider as string;
        const token = nodeConfig.token as string;
        const owner = nodeConfig.owner as string;
        const repo = nodeConfig.repo as string;
        const sha = nodeConfig.sha as string;
        const state = nodeConfig.state as string;
        const description = nodeConfig.description as string | undefined;
        const targetUrl = nodeConfig.targetUrl as string | undefined;

        await logger.info(nodeId, `Updating ${provider} commit status for ${owner}/${repo}@${sha.slice(0, 8)} → ${state}`);

        if (provider === 'github') {
            const url = `https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
                body: JSON.stringify({
                    state,
                    ...(description && { description }),
                    ...(targetUrl && { target_url: targetUrl }),
                    context: 'nexploy/pipeline',
                }),
                signal: abortSignal,
            });

            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`GitHub API returned ${response.status}: ${body}`);
            }
        } else if (provider === 'gitlab') {
            const encodedProject = encodeURIComponent(`${owner}/${repo}`);
            const url = `https://gitlab.com/api/v4/projects/${encodedProject}/statuses/${sha}`;
            const gitlabState = state === 'pending' ? 'pending'
                : state === 'success' ? 'success'
                : state === 'failure' ? 'failed'
                : 'failed';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'PRIVATE-TOKEN': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    state: gitlabState,
                    ...(description && { description }),
                    ...(targetUrl && { target_url: targetUrl }),
                    name: 'nexploy/pipeline',
                }),
                signal: abortSignal,
            });

            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`GitLab API returned ${response.status}: ${body}`);
            }
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        await logger.info(nodeId, `Commit status updated to "${state}"`);
        return { output: { provider, state, sha } };
    }
}

export const updateCommitStatusExecutor = new UpdateCommitStatusExecutor();
