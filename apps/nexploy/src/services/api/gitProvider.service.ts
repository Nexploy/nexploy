import { updateGitProviderToken } from '@/services/git/git.service';
import { GitLabCommit, GitProviderToken } from '@workspace/typescript-interface/git/git';
import { kyGithub } from '@/lib/api/drinoGithub';
import { kyGitlab } from '@/lib/api/drinoGitlab';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';

interface GitHubCommit {
    sha: string;
    commit: {
        message: string;
        author: {
            name: string;
            email: string;
            date: string;
        };
    };
    html_url: string;
}

export async function getValidToken(
    token: GitProviderToken,
    provider: string,
    userId: string,
): Promise<GitProviderToken> {
    if (!token.accessTokenExpiresAt) {
        return token;
    }

    if (new Date(token.accessTokenExpiresAt) < new Date()) {
        if (provider === 'gitlab') {
            return await refreshGitLabToken(token, userId);
        } else if (provider === 'github') {
            return token;
        } else {
            throw new Error(`Unknown provider: ${provider}`);
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

            const response = await kyGitlab
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
        const repoPath = extractGitHubRepoPath(repositoryUrl);

        const ref = commitHash || branch;

        const token: GitProviderToken = {
            accessToken,
            refreshToken: null,
            accessTokenExpiresAt: null,
        };

        return await tokenGitStorage.run(token, async () => {
            const commit = await kyGithub
                .get(`repos/${repoPath}/commits/${ref}`, {
                    headers: {
                        Accept: 'application/vnd.github.v3+json',
                    },
                })
                .json<GitHubCommit>();

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
    const httpsMatch = repositoryUrl.match(/gitlab\.com[\/:](.+?)(\.git)?$/);
    if (httpsMatch && httpsMatch[1]) {
        return httpsMatch[1].replace('.git', '');
    }
    throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
}

function extractGitHubRepoPath(repositoryUrl: string): string {
    const match = repositoryUrl.match(/github\.com[\/:](.+?)(\.git)?$/);
    if (match && match[1]) {
        return match[1].replace('.git', '');
    }
    throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
}

async function refreshGitLabToken(
    token: GitProviderToken,
    userId: string,
): Promise<GitProviderToken> {
    if (!token.refreshToken) {
        throw new Error('No refresh token available for GitLab');
    }

    const clientId = process.env.GITLAB_CLIENT_ID;
    const clientSecret = process.env.GITLAB_CLIENT_SECRET;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
    });

    const response = await fetch(`https://gitlab.com/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
        },
        body,
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Failed to refresh token. Status ${response.status}. Message: ${message}`);
    }

    const data = await response.json();

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    const newToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        accessTokenExpiresAt: expiresAt,
    };

    await updateGitProviderToken('gitlab', userId, newToken);

    return newToken;
}
