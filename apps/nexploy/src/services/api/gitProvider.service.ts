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
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function getValidToken(
    token: GitProviderToken,
    provider: GitProviderType,
    userId: string,
    gitAccountId?: string,
): Promise<GitProviderToken> {
    const t = await getErrorTranslator();
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
            throw new Error(t('gitProvider.oauthTokenExpired', { provider }));
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
    const t = await getErrorTranslator();
    if (provider === 'gitlab') {
        return await getGitLabCommit(repositoryUrl, branch, accessToken, commitHash);
    } else if (provider === 'github') {
        return await getGitHubCommit(repositoryUrl, branch, accessToken, commitHash);
    }

    throw new Error(t('gitProvider.unknownProvider', { provider }));
}

async function getGitLabCommit(
    repositoryUrl: string,
    branch: string,
    accessToken: string | null,
    commitHash?: string,
): Promise<{ hash: string; message: string } | null> {
    const t = await getErrorTranslator();
    const repositoryPath = await extractGitLabRepositoryPath(repositoryUrl);
    const encodedRepositoryPath = encodeURIComponent(repositoryPath);

    const token: GitProviderToken = {
        accessToken,
        refreshToken: null,
        accessTokenExpiresAt: null,
    };

    try {
        const baseUrl = await extractGitLabBaseUrl(repositoryUrl);

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
        throw new Error(t('gitProvider.fetchCommitsFailed', { error: String(error) }));
    }
}

async function getGitHubCommit(
    repositoryUrl: string,
    branch: string,
    accessToken: string | null,
    commitHash?: string,
): Promise<{ hash: string; message: string } | null> {
    try {
        const { owner, repo } = await extractGitHubRepo(repositoryUrl);
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

async function extractGitLabRepositoryPath(repositoryUrl: string): Promise<string> {
    const t = await getErrorTranslator();
    try {
        const url = new URL(repositoryUrl);
        return url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    } catch {
        throw new Error(t('gitProvider.invalidGitlabUrl', { url: repositoryUrl }));
    }
}

async function extractGitLabBaseUrl(repositoryUrl: string): Promise<string> {
    const t = await getErrorTranslator();
    try {
        const url = new URL(repositoryUrl);
        return `${url.protocol}//${url.host}`;
    } catch {
        throw new Error(t('gitProvider.invalidGitlabUrl', { url: repositoryUrl }));
    }
}

async function refreshGitLabToken(
    token: GitProviderToken,
    userId: string,
    gitAccountId?: string,
): Promise<GitProviderToken> {
    const t = await getErrorTranslator();
    if (!token.refreshToken) {
        throw new Error(t('gitProvider.noRefreshTokenGitlab'));
    }

    const gitlabCreds = await getGitProviderCredentials('GITLAB', gitAccountId);
    const clientId = gitlabCreds?.clientId;
    const clientSecret = gitlabCreds?.clientSecret;

    const gitlabBaseUrl = gitlabCreds?.baseUrl;
    if (!gitlabBaseUrl || !clientId || !clientSecret)
        throw new Error(t('gitProvider.gitlabNotConfigured'));
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
            throw new Error(t('gitProvider.gitlabOauthExpired'));
        }
        throw new Error(t('gitProvider.refreshTokenFailedStatus', { status: response.status, message }));
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
    const t = await getErrorTranslator();
    if (!token.refreshToken) {
        throw new Error(t('gitProvider.noRefreshTokenGithub'));
    }

    const githubCreds = await getGitProviderCredentials('GITHUB', gitAccountId);
    if (!githubCreds) {
        throw new Error(t('gitProvider.githubNotConfigured'));
    }

    const data = await githubRefreshAccessToken(
        token.refreshToken,
        githubCreds.clientId,
        githubCreds.clientSecret,
    );

    if (data.error) {
        throw new Error(t('gitProvider.githubTokenRefreshFailed', { error: data.error_description || data.error }));
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
