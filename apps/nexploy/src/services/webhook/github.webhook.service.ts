import { WebhookPayload } from '@workspace/typescript-interface/webhook';

export function parseGitHubWebhook(payload: any): WebhookPayload | null {
    if (!payload.ref?.startsWith('refs/heads/')) {
        return null;
    }

    return {
        repositoryUrl: payload.repository?.clone_url || payload.repository?.html_url,
        branch: payload.ref.replace('refs/heads/', ''),
        commitHash: payload.head_commit?.id?.substring(0, 8),
        commitMessage: payload.head_commit?.message,
    };
}
