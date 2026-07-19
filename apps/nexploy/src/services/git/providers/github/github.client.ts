import ky, { Options } from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';
import { GithubRepo } from '@workspace/typescript-interface/git/repository/github.repository';
import { GithubBranch } from '@workspace/typescript-interface/git/branch/github.branch';
import {
    GitHubCommitResponse,
    GitHubManifestResponse,
    GitHubTokenResponse,
    GitHubUserResponse,
} from '@workspace/typescript-interface/git/github.api';

export type {
    GitHubCommitResponse,
    GitHubTokenResponse,
    GitHubUserResponse,
    GitHubManifestResponse,
};

export interface KyGithubOptions extends Options {
    withAuth?: boolean;
    token?: string;
}

export const kyGithubApi = ky.create({
    prefixUrl: 'https://api.github.com',
    hooks: {
        beforeRequest: [
            (request, options) => {
                const opts = options as KyGithubOptions;
                if (opts.withAuth === false) return;
                const accessToken = opts.token ?? getTokenGitStorage().accessToken;
                request.headers.set('Authorization', `Bearer ${accessToken}`);
            },
        ],
    },
});

export const kyGithubPublic = ky.create({
    prefixUrl: 'https://github.com',
    headers: {
        Accept: 'application/json',
    },
});

export async function githubGetRepository(owner: string, repo: string): Promise<GithubRepo> {
    return kyGithubApi
        .get(`repos/${owner}/${repo}`, {
            headers: { Accept: 'application/vnd.github+json' },
        })
        .json<GithubRepo>();
}

export async function githubGetCommit(
    repoPath: string,
    ref: string,
): Promise<GitHubCommitResponse> {
    return kyGithubApi
        .get(`repos/${repoPath}/commits/${ref}`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
        })
        .json<GitHubCommitResponse>();
}

export async function githubGetUserInstallations(): Promise<{
    installations: { id: number }[];
}> {
    return kyGithubApi
        .get('user/installations', {
            headers: { Accept: 'application/vnd.github+json' },
        })
        .json<{ installations: { id: number }[] }>();
}

export async function githubGetInstallationRepositories(
    installationId: number,
): Promise<{ repositories: GithubRepo[] }> {
    return kyGithubApi
        .get(`user/installations/${installationId}/repositories`, {
            headers: { Accept: 'application/vnd.github+json' },
            searchParams: { per_page: '100' },
        })
        .json<{ repositories: GithubRepo[] }>();
}

export async function githubGetRepositoryBranches(
    owner: string,
    repo: string,
): Promise<GithubBranch[]> {
    return kyGithubApi
        .get(`repos/${owner}/${repo}/branches`, {
            headers: { Accept: 'application/vnd.github+json' },
        })
        .json<GithubBranch[]>();
}

export async function githubCreateWebhook(
    owner: string,
    repo: string,
    webhookUrl: string,
    secret: string,
): Promise<{ id: number }> {
    return kyGithubApi
        .post(`repos/${owner}/${repo}/hooks`, {
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            json: {
                name: 'web',
                active: true,
                events: ['push'],
                config: {
                    url: webhookUrl,
                    content_type: 'json',
                    insecure_ssl: '0',
                    secret,
                },
            },
        })
        .json<{ id: number }>();
}

export async function githubDeleteWebhook(
    owner: string,
    repo: string,
    webhookId: string,
): Promise<void> {
    await kyGithubApi.delete(`repos/${owner}/${repo}/hooks/${webhookId}`).json();
}

export async function githubExchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
): Promise<GitHubTokenResponse> {
    return kyGithubPublic
        .post('login/oauth/access_token', {
            headers: { 'Content-Type': 'application/json' },
            json: {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            },
        })
        .json<GitHubTokenResponse>();
}

export async function githubRefreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
): Promise<GitHubTokenResponse> {
    return kyGithubPublic
        .post('login/oauth/access_token', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        })
        .json<GitHubTokenResponse>();
}

export async function githubGetAuthenticatedUser(): Promise<GitHubUserResponse> {
    return kyGithubApi.get('user').json<GitHubUserResponse>();
}

export async function githubRevokeGrant(
    clientId: string,
    clientSecret: string,
    accessToken: string,
): Promise<void> {
    try {
        await kyGithubApi.delete(`applications/${clientId}/grant`, {
            withAuth: false,
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            json: { access_token: accessToken },
        } as KyGithubOptions);
    } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 404) return;
        throw error;
    }
}

export async function githubExchangeManifestCode(code: string): Promise<GitHubManifestResponse> {
    return kyGithubApi
        .post(`app-manifests/${code}/conversions`, {
            headers: { Accept: 'application/vnd.github+json' },
            withAuth: false,
        } as KyGithubOptions)
        .json<GitHubManifestResponse>();
}

export async function githubCreateRelease(
    token: string,
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
    return kyGithubApi
        .post(`repos/${owner}/${repo}/releases`, {
            token,
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            json: {
                tag_name: options.tagName,
                target_commitish: options.targetBranch,
                name: options.name || options.tagName,
                body: options.body,
                draft: options.draft,
                prerelease: options.prerelease,
            },
        } as KyGithubOptions)
        .json<{ id: number; html_url: string; tag_name: string }>();
}

export async function githubUpdateCommitStatus(
    token: string,
    owner: string,
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    options: { description?: string; context: string },
): Promise<void> {
    try {
        await kyGithubApi.post(`repos/${owner}/${repo}/statuses/${sha}`, {
            token,
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            json: {
                state,
                ...(options?.description && { description: options.description }),
                context: options.context,
            },
        } as KyGithubOptions);
    } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
            throw new Error(
                'GitHub returned 403: the GitHub App is missing the "Commit statuses: Read & write" permission. ' +
                    'Go to your GitHub App settings → Permissions & events → Commit statuses → Read & write, then reinstall the app.',
            );
        }
        throw error;
    }
}
