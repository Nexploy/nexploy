import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export interface GiteaRepo {
    id: number;
    name: string;
    full_name: string;
    clone_url: string;
    private: boolean;
    default_branch: string;
}

export interface GiteaBranch {
    name: string;
    protected: boolean;
}

export interface GiteaCommit {
    sha: string;
    commit: { message: string };
}

export interface GiteaUser {
    id: number;
    login: string;
}

export function kyGitea(baseUrl: string, explicitToken?: string) {
    return ky.create({
        prefixUrl: `${baseUrl}/api/v1`,
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

export async function giteaGetUserRepositories(baseUrl: string): Promise<GiteaRepo[]> {
    return kyGitea(baseUrl)
        .get('user/repos', { searchParams: { limit: '50' } })
        .json<GiteaRepo[]>();
}

export async function giteaGetRepository(
    baseUrl: string,
    owner: string,
    repo: string,
): Promise<GiteaRepo> {
    return kyGitea(baseUrl).get(`repos/${owner}/${repo}`).json<GiteaRepo>();
}

export async function giteaGetRepositoryBranches(
    baseUrl: string,
    owner: string,
    repo: string,
): Promise<GiteaBranch[]> {
    return kyGitea(baseUrl).get(`repos/${owner}/${repo}/branches`).json<GiteaBranch[]>();
}

export async function giteaGetCommits(
    baseUrl: string,
    owner: string,
    repo: string,
    options: { branch?: string; commitHash?: string },
): Promise<GiteaCommit | GiteaCommit[]> {
    if (options.commitHash) {
        return kyGitea(baseUrl)
            .get(`repos/${owner}/${repo}/git/commits/${options.commitHash}`)
            .json<GiteaCommit>();
    }
    return kyGitea(baseUrl)
        .get(`repos/${owner}/${repo}/commits`, {
            searchParams: { limit: '1', ...(options.branch && { sha: options.branch }) },
        })
        .json<GiteaCommit[]>();
}

export async function giteaGetAuthenticatedUser(
    baseUrl: string,
    token: string,
): Promise<GiteaUser> {
    return kyGitea(baseUrl, token).get('user').json<GiteaUser>();
}

export async function giteaCreateWebhook(
    baseUrl: string,
    owner: string,
    repo: string,
    webhookUrl: string,
    secret: string,
): Promise<{ id: number }> {
    return kyGitea(baseUrl)
        .post(`repos/${owner}/${repo}/hooks`, {
            json: {
                type: 'gitea',
                active: true,
                events: ['push'],
                config: {
                    url: webhookUrl,
                    content_type: 'json',
                    secret,
                },
            },
        })
        .json<{ id: number }>();
}

export async function giteaDeleteWebhook(
    baseUrl: string,
    owner: string,
    repo: string,
    hookId: string,
): Promise<void> {
    await kyGitea(baseUrl).delete(`repos/${owner}/${repo}/hooks/${hookId}`).json();
}

export async function giteaCreateRelease(
    token: string,
    baseUrl: string,
    owner: string,
    repo: string,
    options: {
        tagName: string;
        targetBranch: string;
        name: string;
        body: string;
        draft: boolean;
        prerelease: boolean;
    },
): Promise<{ id: number; html_url: string; tag_name: string }> {
    return kyGitea(baseUrl, token)
        .post(`repos/${owner}/${repo}/releases`, {
            json: {
                tag_name: options.tagName,
                target_commitish: options.targetBranch,
                name: options.name || options.tagName,
                body: options.body,
                draft: options.draft,
                prerelease: options.prerelease,
            },
        })
        .json<{ id: number; html_url: string; tag_name: string }>();
}

export async function giteaUpdateCommitStatus(
    token: string,
    baseUrl: string,
    owner: string,
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    options: { description?: string; context: string },
): Promise<void> {
    await kyGitea(baseUrl, token).post(`repos/${owner}/${repo}/statuses/${sha}`, {
        json: {
            state,
            ...(options?.description && { description: options.description }),
            context: options.context,
        },
    });
}

export async function giteaExchangeCodeForToken(
    baseUrl: string,
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
): Promise<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
}> {
    return ky
        .post(`${baseUrl}/login/oauth/access_token`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
            throwHttpErrors: false,
        })
        .json();
}

export async function giteaRefreshAccessToken(
    baseUrl: string,
    refreshToken: string,
    clientId: string,
    clientSecret: string,
): Promise<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
}> {
    return ky
        .post(`${baseUrl}/login/oauth/access_token`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            }),
            throwHttpErrors: false,
        })
        .json();
}
