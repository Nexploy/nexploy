import { kyGithub } from '@/lib/api/kyGithub';
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
    return kyGithub
        .get(`repos/${repoPath}/commits/${ref}`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
        })
        .json<GitHubCommitResponse>();
}

export async function githubGetUserInstallations(): Promise<{
    installations: { id: number }[];
}> {
    return kyGithub
        .get('user/installations', {
            headers: { Accept: 'application/vnd.github+json' },
        })
        .json<{ installations: { id: number }[] }>();
}

export async function githubGetInstallationRepositories(
    installationId: number,
): Promise<{ repositories: GithubRepo[] }> {
    return kyGithub
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
    return kyGithub
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
    return kyGithub
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
    await kyGithub.delete(`repos/${owner}/${repo}/hooks/${webhookId}`).json();
}

export async function githubExchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
): Promise<GitHubTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
        }),
    });
    return response.json();
}

export async function githubRefreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
): Promise<GitHubTokenResponse> {
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    });

    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        body,
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            `Failed to refresh GitHub token. Status ${response.status}. Message: ${message}`,
        );
    }

    return response.json();
}

export async function githubGetAuthenticatedUser(accessToken: string): Promise<GitHubUserResponse> {
    const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json();
}

export async function githubExchangeManifestCode(code: string): Promise<GitHubManifestResponse> {
    const response = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
        method: 'POST',
        headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub App manifest exchange failed: ${errorText}`);
    }

    return response.json();
}
