import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export function kyGitlab(baseUrl: string, explicitToken?: string) {
    return ky.create({
        prefixUrl: `${baseUrl}/api`,
        hooks: {
            beforeRequest: [
                (request) => {
                    const accessToken = explicitToken ?? getTokenGitStorage().accessToken;
                    request.headers.set('Authorization', `Bearer ${accessToken}`);
                },
            ],
        },
    });
}

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

export async function gitlabCreateRelease(
    token: string,
    baseUrl: string,
    owner: string,
    repo: string,
    options: {
        tagName: string;
        ref: string;
        name: string;
        description: string;
    },
): Promise<{ tag_name: string; _links: { self: string } }> {
    const encodedProject = encodeURIComponent(`${owner}/${repo}`);
    return kyGitlab(baseUrl, token)
        .post(`v4/projects/${encodedProject}/releases`, {
            json: {
                tag_name: options.tagName,
                ref: options.ref,
                name: options.name || options.tagName,
                description: options.description,
            },
        })
        .json<{ tag_name: string; _links: { self: string } }>();
}

export async function gitlabUpdateCommitStatus(
    token: string,
    baseUrl: string,
    owner: string,
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    options: { description?: string; context: string },
): Promise<void> {
    const encodedProject = encodeURIComponent(`${owner}/${repo}`);
    await kyGitlab(baseUrl, token).post(`v4/projects/${encodedProject}/statuses/${sha}`, {
        json: {
            state: GITLAB_STATE_MAP[state],
            ...(options?.description && { description: options.description }),
            name: options.context,
        },
    });
}
