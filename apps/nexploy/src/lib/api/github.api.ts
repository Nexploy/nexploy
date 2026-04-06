import { kyGithubApi, kyGithubPublic, KyGithubOptions } from '@/lib/api/kyGithub';
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

export async function githubExchangeManifestCode(code: string): Promise<GitHubManifestResponse> {
    return kyGithubApi
        .post(`app-manifests/${code}/conversions`, {
            headers: { Accept: 'application/vnd.github+json' },
            withAuth: false,
        } as KyGithubOptions)
        .json<GitHubManifestResponse>();
}
