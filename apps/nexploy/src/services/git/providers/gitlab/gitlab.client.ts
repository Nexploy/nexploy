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

const PAGE_LIMIT = 100;
const MAX_PAGES = 20;

export async function gitlabFetchAllPages<T>(
    baseUrl: string,
    endpoint: string,
    searchParams: Record<string, string> = {},
): Promise<T[]> {
    const results: T[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
        const pageResults = await kyGitlab(baseUrl)
            .get(endpoint, {
                searchParams: { ...searchParams, page: `${page}`, per_page: `${PAGE_LIMIT}` },
            })
            .json<T[]>();

        results.push(...pageResults);

        if (pageResults.length < PAGE_LIMIT) break;
    }

    return results;
}

export async function gitlabRevokeToken(
    baseUrl: string,
    token: string,
    clientId: string,
    clientSecret: string,
): Promise<void> {
    await ky.post(`${baseUrl}/oauth/revoke`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            token,
        }),
        throwHttpErrors: false,
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
                tag_push_events: true,
                merge_requests_events: true,
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
