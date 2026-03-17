import { WebhookPayload } from '@workspace/typescript-interface/webhook';

export function extractGitLabProjectId(repositoryUrl: string): string {
    try {
        const url = new URL(repositoryUrl);
        const path = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
        return encodeURIComponent(path);
    } catch {
        throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
    }
}

export function parseGitLabWebhook(payload: any): WebhookPayload | null {
    if (payload.object_kind !== 'push' || !payload.ref?.startsWith('refs/heads/')) {
        return null;
    }

    const lastCommit = payload.commits?.[payload.commits.length - 1];

    return {
        repositoryUrl: payload.project?.git_http_url || payload.project?.http_url,
        branch: payload.ref.replace('refs/heads/', ''),
        commitHash: lastCommit?.id?.substring(0, 8),
        commitMessage: lastCommit?.message,
    };
}
