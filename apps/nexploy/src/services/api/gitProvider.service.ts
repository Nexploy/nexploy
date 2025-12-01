import { updateGitProviderToken } from '@/services/git/git.service';
import { GetGitProviderToken, GitLabCommit } from '@workspace/typescript-interface/git';
import { env } from '../../../env';

class GitProviderService {
    async getValidToken(
        token: GetGitProviderToken,
        provider: string,
        userId: string,
    ): Promise<string | null> {
        if (!token.accessTokenExpiresAt) {
            return token.accessToken;
        }

        if (new Date(token.accessTokenExpiresAt) < new Date()) {
            if (provider === 'gitlab') {
                return await this.refreshGitLabToken(token, userId);
            } else if (provider === 'github') {
                console.warn(
                    `GitHub access token expired for user ${userId}. User must re-authenticate.`,
                );
                return null;
            } else {
                throw new Error(`Unknown provider: ${provider}`);
            }
        }

        return token.accessToken;
    }

    async getLatestCommit(
        repositoryUrl: string,
        branch: string,
        accessToken: string | null,
        provider: string,
    ): Promise<{ hash: string; message: string } | null> {
        if (provider === 'gitlab') {
            return await this.getLatestGitLabCommit(repositoryUrl, branch, accessToken);
        } else if (provider === 'github') {
            return await this.getLatestGitHubCommit(repositoryUrl, branch, accessToken);
        }

        throw new Error(`Unknown provider: ${provider}`);
    }

    private async getLatestGitLabCommit(
        repositoryUrl: string,
        branch: string,
        accessToken: string | null,
    ): Promise<{ hash: string; message: string } | null> {
        try {
            const projectPath = this.extractGitLabProjectPath(repositoryUrl);
            const encodedProjectPath = encodeURIComponent(projectPath);

            const response = await fetch(
                `https://gitlab.com/api/v4/projects/${encodedProjectPath}/repository/commits?ref_name=${branch}&per_page=1`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!response.ok) {
                console.error(`GitLab API error: ${response.status} ${response.statusText}`);
                return null;
            }

            const commits: GitLabCommit[] = await response.json();

            if (commits.length === 0) {
                console.warn(`No commits found for branch ${branch}`);
                return null;
            }

            const latestCommit = commits[0];
            if (!latestCommit) return null;

            return {
                hash: latestCommit.short_id,
                message: latestCommit.message,
            };
        } catch (error) {
            console.error('Error fetching latest GitLab commit:', error);
            return null;
        }
    }

    private async getLatestGitHubCommit(
        repositoryUrl: string,
        branch: string,
        accessToken: string | null,
    ): Promise<{ hash: string; message: string } | null> {
        try {
            // Extract owner/repo from URL (e.g., "owner/repo")
            const repoPath = this.extractGitHubRepoPath(repositoryUrl);

            const response = await fetch(
                `https://api.github.com/repos/${repoPath}/commits/${branch}`,
                {
                    headers: {
                        Authorization: `token ${accessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                },
            );

            if (!response.ok) {
                console.error(`GitHub API error: ${response.status} ${response.statusText}`);
                return null;
            }

            const commit = await response.json();

            return {
                hash: commit.sha.substring(0, 8),
                message: commit.commit.message,
            };
        } catch (error) {
            console.error('Error fetching latest GitHub commit:', error);
            return null;
        }
    }

    private extractGitLabProjectPath(repositoryUrl: string): string {
        const httpsMatch = repositoryUrl.match(/gitlab\.com[\/:](.+?)(\.git)?$/);
        if (httpsMatch && httpsMatch[1]) {
            return httpsMatch[1].replace('.git', '');
        }
        throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
    }

    private extractGitHubRepoPath(repositoryUrl: string): string {
        const match = repositoryUrl.match(/github\.com[\/:](.+?)(\.git)?$/);
        if (match && match[1]) {
            return match[1].replace('.git', '');
        }
        throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
    }

    private async refreshGitLabToken(token: GetGitProviderToken, userId: string): Promise<string> {
        if (!token.refreshToken) {
            throw new Error('No refresh token available for GitLab');
        }

        const clientId = env.GITLAB_CLIENT_ID;
        const clientSecret = env.GITLAB_CLIENT_SECRET;

        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: token.refreshToken,
        });

        const response = await fetch(`https://gitlab.com/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(
                `Failed to refresh token. Status ${response.status}. Message: ${message}`,
            );
        }

        const data = await response.json();

        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        await updateGitProviderToken('gitlab', userId, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpiresAt: expiresAt,
        });

        return data.access_token;
    }
}

export const gitProviderService = new GitProviderService();
