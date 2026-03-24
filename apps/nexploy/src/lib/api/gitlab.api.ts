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
