import { kyGitlab } from '@/lib/api/kyGitlab';

export async function gitlabCreateWebhook(
    baseUrl: string,
    projectId: string,
    webhookUrl: string,
    secret: string,
): Promise<{ id: number }> {
    return kyGitlab(baseUrl)
        .post(`v4/projects/${encodeURIComponent(projectId)}/hooks`, {
            json: {
                url: webhookUrl,
                token: secret,
                push_events: true,
                enable_ssl_verification: true,
            },
        })
        .json<{ id: number }>();
}

export async function gitlabDeleteWebhook(
    baseUrl: string,
    projectId: string,
    hookId: string,
): Promise<void> {
    await kyGitlab(baseUrl)
        .delete(`v4/projects/${encodeURIComponent(projectId)}/hooks/${hookId}`)
        .json();
}

const GITLAB_STATE_MAP = {
    pending: 'pending',
    success: 'success',
    failure: 'failed',
    error: 'failed',
} as const;

export async function gitlabUpdateCommitStatus(
    token: string,
    baseUrl: string,
    owner: string,
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    options?: { description?: string; targetUrl?: string; context?: string },
): Promise<void> {
    const encodedProject = encodeURIComponent(`${owner}/${repo}`);
    await kyGitlab(baseUrl, token).post(`v4/projects/${encodedProject}/statuses/${sha}`, {
        json: {
            state: GITLAB_STATE_MAP[state],
            ...(options?.description && { description: options.description }),
            ...(options?.targetUrl && { target_url: options.targetUrl }),
            name: options?.context ?? 'nexploy/pipeline',
        },
    });
}
