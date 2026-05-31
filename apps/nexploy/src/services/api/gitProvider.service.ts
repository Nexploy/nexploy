import {
    extractGitHubRepo,
    getGitProviderToken,
    updateGitProviderToken,
} from '@/services/git/git.service';
import { GitLabCommit, GitProviderToken } from '@workspace/typescript-interface/git/git';
import { kyGitlab } from '@/lib/api/kyGitlab';
import dayjs from 'dayjs';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { getGitProviderCredentials } from '@/services/oauthProvider.service';
import { githubGetCommit, githubRefreshAccessToken } from '@/lib/api/github.api';
import { GitProviderType } from 'generated/client';

export async function getValidToken(
    token: GitProviderToken,
    provider: GitProviderType,
    userId: string,
    gitAccountId?: string,
): Promise<GitProviderToken> {
    if (!token.accessTokenExpiresAt) {
        return token;
    }

    if (dayjs(token.accessTokenExpiresAt).isBefore(dayjs())) {
        try {
            if (provider === 'GITLAB') {
                return await refreshGitLabToken(token, userId, gitAccountId);
            } else if (provider === 'GITHUB') {
                return await refreshGitHubToken(token, userId, gitAccountId);
            }
        } catch {
            const freshToken = await getGitProviderToken(provider, {
                gitAccountId,
                requestedUserId: userId,
            });
            if (
                !freshToken.accessTokenExpiresAt ||
                dayjs(freshToken.accessTokenExpiresAt).isAfter(dayjs())
            ) {
                return freshToken;
            }
            throw new Error(
                `Your ${provider} OAuth token has expired or been revoked. Please reconnect your account from the integrations settings.`,
            );
        }
    }

    return token;
}

export async function getCommit(
    repositoryUrl: string,
    branch: string,
    accessToken: string | null,
    provider: string,
    commitHash?: string,
): Promise<{ hash: string; message: string } | null> {
    if (provider === 'gitlab') {
        return await getGitLabCommit(repositoryUrl, branch, accessToken, commitHash);
    } else if (provider === 'github') {
        return await getGitHubCommit(repositoryUrl, branch, accessToken, commitHash);
    }

    throw new Error(`Unknown provider: ${provider}`);
}

async function getGitLabCommit(
    repositoryUrl: string,
    branch: string,
    accessToken: string | null,
    commitHash?: string,
): Promise<{ hash: string; message: string } | null> {
    const repositoryPath = extractGitLabRepositoryPath(repositoryUrl);
    const encodedRepositoryPath = encodeURIComponent(repositoryPath);

    const token: GitProviderToken = {
        accessToken,
        refreshToken: null,
        accessTokenExpiresAt: null,
    };

    try {
        const baseUrl = extractGitLabBaseUrl(repositoryUrl);

        return await tokenGitStorage.run(token, async () => {
            const endpoint = commitHash
                ? `v4/projects/${encodedRepositoryPath}/repository/commits/${commitHash}`
                : `v4/projects/${encodedRepositoryPath}/repository/commits`;

            const searchParams = commitHash
                ? undefined
                : {
                      ref_name: branch,
                      per_page: '1',
                  };

            const response = await kyGitlab(baseUrl)
                .get(endpoint, { searchParams })
                .json<GitLabCommit | GitLabCommit[]>();

            const commit = Array.isArray(response) ? response[0] : response;

            if (!commit) return null;

            return {
                hash: commit.short_id,
                message: commit.message,
            };
        });
    } catch (error) {
        throw new Error(`Failed to fetch commits: ${error}`);
    }
}

async function getGitHubCommit(
    repositoryUrl: string,
    branch: string,
    accessToken: string | null,
    commitHash?: string,
): Promise<{ hash: string; message: string } | null> {
    try {
        const { owner, repo } = extractGitHubRepo(repositoryUrl);
        const repoPath = `${owner}/${repo}`;
        const ref = commitHash || branch;

        const token: GitProviderToken = {
            accessToken,
            refreshToken: null,
            accessTokenExpiresAt: null,
        };

        return await tokenGitStorage.run(token, async () => {
            const commit = await githubGetCommit(repoPath, ref);

            return {
                hash: commit.sha.substring(0, 8),
                message: commit.commit.message,
            };
        });
    } catch (error) {
        return null;
    }
}

function extractGitLabRepositoryPath(repositoryUrl: string): string {
    try {
        const url = new URL(repositoryUrl);
        return url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    } catch {
        throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
    }
}

function extractGitLabBaseUrl(repositoryUrl: string): string {
    try {
        const url = new URL(repositoryUrl);
        return `${url.protocol}//${url.host}`;
    } catch {
        throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
    }
}

async function refreshGitLabToken(
    token: GitProviderToken,
    userId: string,
    gitAccountId?: string,
): Promise<GitProviderToken> {
    if (!token.refreshToken) {
        throw new Error('No refresh token available for GitLab');
    }

    const gitlabCreds = await getGitProviderCredentials('GITLAB', gitAccountId);
    const clientId = gitlabCreds?.clientId;
    const clientSecret = gitlabCreds?.clientSecret;

    const gitlabBaseUrl = gitlabCreds?.baseUrl;
    if (!gitlabBaseUrl || !clientId || !clientSecret)
        throw new Error('GitLab provider not configured');
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
    });

    const response = await fetch(`${gitlabBaseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
        },
        body,
    });

    if (!response.ok) {
        const message = await response.text();
        let errorData: { error?: string } = {};
        try {
            errorData = JSON.parse(message);
        } catch {}
        if (errorData.error === 'invalid_grant') {
            throw new Error(
                'Your GitLab OAuth token has expired or been revoked. Please reconnect your GitLab account from the integrations settings.',
            );
        }
        throw new Error(`Failed to refresh token. Status ${response.status}. Message: ${message}`);
    }

    const data = await response.json();

    const newToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? token.refreshToken,
        accessTokenExpiresAt: data.expires_in
            ? dayjs().add(data.expires_in, 'second').toDate()
            : null,
    };

    await updateGitProviderToken('GITLAB', userId, newToken, gitAccountId);

    return newToken;
}

async function refreshGitHubToken(
    token: GitProviderToken,
    userId: string,
    gitAccountId?: string,
): Promise<GitProviderToken> {
    if (!token.refreshToken) {
        throw new Error('No refresh token available for GitHub');
    }

    const githubCreds = await getGitProviderCredentials('GITHUB', gitAccountId);
    if (!githubCreds) {
        throw new Error('GitHub provider not configured');
    }

    const data = await githubRefreshAccessToken(
        token.refreshToken,
        githubCreds.clientId,
        githubCreds.clientSecret,
    );

    if (data.error) {
        throw new Error(`GitHub token refresh failed: ${data.error_description || data.error}`);
    }

    const expiresAt = data.expires_in ? dayjs().add(data.expires_in, 'second').toDate() : null;

    const newToken: GitProviderToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? token.refreshToken,
        accessTokenExpiresAt: expiresAt,
    };

    await updateGitProviderToken('GITHUB', userId, newToken, gitAccountId);

    return newToken;
}
